const ALLOWED_ROLES = ['ATHLETE', 'COACH', 'CLUB_ADMIN'] as const
const DEFAULT_CITY = 'تهران'
const DEFAULT_SPORT = 'fitness'

function clubSlugFromEmail(email: string) {
  const local = email
    .split('@')[0]
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `club-${local || 'new'}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name?: string
    email?: string
    password?: string
    role?: string
    sport?: string
    city?: string
    bioFa?: string
    sessionPrice?: number
  }>(event)
  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''
  const role = (ALLOWED_ROLES as readonly string[]).includes(body.role ?? '')
    ? (body.role as (typeof ALLOWED_ROLES)[number])
    : 'ATHLETE'
  const city = body.city?.trim() || DEFAULT_CITY

  if (!name || !email || password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
  }

  if (role === 'COACH') {
    const sportSlug = body.sport?.trim() || DEFAULT_SPORT
    const sport = await prisma.sport.findUnique({ where: { slug: sportSlug } })
    if (!sport) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid sport' })
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, role, passwordHash: hashSecret(password) },
    })

    if (role === 'COACH') {
      const sportSlug = body.sport?.trim() || DEFAULT_SPORT
      const sport = await tx.sport.findUniqueOrThrow({ where: { slug: sportSlug } })
      await tx.coach.create({
        data: {
          nameFa: name,
          nameEn: name,
          city,
          sportId: sport.id,
          userId: created.id,
          bioFa: body.bioFa?.trim() || null,
          bioEn: body.bioEn?.trim() || body.bioFa?.trim() || null,
          sessionPrice: body.sessionPrice !== undefined ? Math.round(body.sessionPrice) : 300000,
        },
      })
    }

    if (role === 'ATHLETE') {
      const sportSlug = body.sport?.trim() || DEFAULT_SPORT
      const sport = await tx.sport.findUniqueOrThrow({ where: { slug: sportSlug } })
      await tx.athleteProfile.create({
        data: { userId: created.id, sportId: sport.id, level: 'BEGINNER' },
      })
    }

    if (role === 'CLUB_ADMIN') {
      let slug = clubSlugFromEmail(email)
      let suffix = 0
      while (await tx.club.findUnique({ where: { slug } })) {
        suffix += 1
        slug = `${clubSlugFromEmail(email)}-${suffix}`
      }
      const sport = await tx.sport.findUniqueOrThrow({ where: { slug: DEFAULT_SPORT } })
      const club = await tx.club.create({
        data: {
          slug,
          nameFa: name,
          nameEn: name,
          addressFa: `${DEFAULT_CITY}`,
          addressEn: 'Tehran',
          city: DEFAULT_CITY,
          ownerId: created.id,
        },
      })
      await tx.court.create({
        data: {
          nameFa: 'زمین ۱',
          nameEn: 'Court 1',
          clubId: club.id,
          sportId: sport.id,
        },
      })
    }

    return created
  })

  await ensureWalletsForUser(user.id)

  await setUserSession(event, {
    user: toSessionUser(user),
  })

  return { id: user.id, email: user.email, name: user.name, nameEn: user.nameEn, role: user.role }
})
