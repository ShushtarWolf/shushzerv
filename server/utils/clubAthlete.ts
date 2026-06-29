import { randomBytes } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { hashSecret } from './password'
import { isValidIranMobile, normalizePhone, phoneLookupVariants } from './phone'
import { ensureWalletsForUser } from './wallet'

const DEFAULT_SPORT = 'fitness'
const GUEST_EMAIL_DOMAIN = 'guest.shushzerv.local'

type Tx = Prisma.TransactionClient

export type ClubBookingAthleteInput = {
  athleteName?: string
  athletePhone?: string
  athleteEmail?: string
  /** @deprecated use athleteName */
  guestName?: string
}

export type ResolvedClubBookingAthlete = {
  userId?: string
  guestName?: string
}

function guestEmailForPhone(normalizedPhone: string): string {
  return `phone+${normalizedPhone}@${GUEST_EMAIL_DOMAIN}`
}

async function findAthleteByPhone(client: Tx | typeof prisma, phone: string) {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  return client.user.findFirst({
    where: { phone: { in: phoneLookupVariants(normalized) } },
  })
}

async function createGuestAthlete(client: Tx | typeof prisma, name: string, normalizedPhone: string) {
  const email = guestEmailForPhone(normalizedPhone)
  const existingByEmail = await client.user.findUnique({ where: { email } })
  if (existingByEmail) return existingByEmail

  const sport = await client.sport.findUniqueOrThrow({ where: { slug: DEFAULT_SPORT } })
  const password = randomBytes(32).toString('hex')

  return client.user.create({
    data: {
      name,
      email,
      phone: normalizedPhone,
      role: 'ATHLETE',
      passwordHash: hashSecret(password),
      athleteProfile: { create: { sportId: sport.id, level: 'BEGINNER' } },
    },
  })
}

export async function resolveClubBookingAthlete(
  input: ClubBookingAthleteInput,
): Promise<ResolvedClubBookingAthlete> {
  const athleteEmail = input.athleteEmail?.trim().toLowerCase()
  const athleteName = (input.athleteName ?? input.guestName)?.trim()
  const athletePhone = input.athletePhone?.trim()

  if (athleteEmail) {
    const athlete = await prisma.user.findUnique({ where: { email: athleteEmail } })
    if (!athlete) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }
    return { userId: athlete.id }
  }

  if (athletePhone) {
    const normalized = normalizePhone(athletePhone)
    if (!isValidIranMobile(normalized)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid phone number' })
    }
    if (!athleteName) {
      throw createError({ statusCode: 400, statusMessage: 'athleteName is required with athletePhone' })
    }

    let athlete = await findAthleteByPhone(prisma, athletePhone)
    if (!athlete) {
      athlete = await createGuestAthlete(prisma, athleteName, normalized)
      await ensureWalletsForUser(athlete.id)
    }
    return { userId: athlete.id }
  }

  if (athleteName) {
    return { guestName: athleteName }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'athleteName and athletePhone, or athleteEmail is required',
  })
}

export async function lookupClubAthleteByPhone(phone: string) {
  const normalized = normalizePhone(phone)
  if (!normalized || !isValidIranMobile(normalized)) return null
  const athlete = await findAthleteByPhone(prisma, phone)
  if (!athlete) return null
  return { id: athlete.id, name: athlete.name, phone: athlete.phone ?? normalized }
}
