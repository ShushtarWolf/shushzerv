import { generateSlotsForCourtDate, resolveSlotGenerationParams } from '../../../utils/clubSlots'
import {
  assertCoachAvailableForSlots,
  createClubCoachSession,
  notifyCoachOfClubSession,
} from '../../../utils/clubBooking'

type ReservationInput =
  | { slotId: string }
  | { courtId: string; date: string; startTime: string; endTime: string }

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    slotIds?: string[]
    reservations?: ReservationInput[]
    coachId?: string
    guestName?: string
    athleteName?: string
    athletePhone?: string
    athleteEmail?: string
    payAtClub?: boolean
  }>(event)

  const coachId = body.coachId?.trim() || undefined
  const { userId: athleteId, guestName } = await resolveClubBookingAthlete(body)

  if (coachId && !athleteId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Coach session requires customer phone number',
    })
  }

  const inputs: ReservationInput[] = []
  if (body.slotIds?.length) {
    for (const slotId of body.slotIds) inputs.push({ slotId })
  }
  if (body.reservations?.length) {
    inputs.push(...body.reservations)
  }
  if (!inputs.length) {
    throw createError({ statusCode: 400, statusMessage: 'slotIds or reservations required' })
  }
  if (inputs.length > 50) {
    throw createError({ statusCode: 400, statusMessage: 'Maximum 50 slots per request' })
  }

  const resolvedSlotIds: string[] = []

  for (const input of inputs) {
    if ('slotId' in input && input.slotId) {
      const slot = await prisma.slot.findUnique({
        where: { id: input.slotId },
        include: { court: { include: { club: true } } },
      })
      if (!slot || slot.court.club.ownerId !== user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
      }
      resolvedSlotIds.push(slot.id)
      continue
    }

    if (!('courtId' in input) || !input.courtId || !input.date || !input.startTime || !input.endTime) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid reservation entry' })
    }

    const court = await prisma.court.findFirst({
      where: { id: input.courtId, club: { ownerId: user.id } },
      include: { club: true },
    })
    if (!court) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

    let slot = await prisma.slot.findFirst({
      where: {
        courtId: input.courtId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
      },
    })

    if (!slot) {
      const { durationMinutes, openTime, closeTime, price } = resolveSlotGenerationParams(court.club, {})
      await generateSlotsForCourtDate({
        courtId: input.courtId,
        date: input.date,
        durationMinutes,
        openTime,
        closeTime,
        price,
      })
      slot = await prisma.slot.findFirst({
        where: {
          courtId: input.courtId,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
        },
      })
    }

    if (!slot) {
      throw createError({ statusCode: 409, statusMessage: 'Could not create slot for selected time' })
    }
    resolvedSlotIds.push(slot.id)
  }

  const uniqueSlotIds = [...new Set(resolvedSlotIds)]

  const slotsForCoach = await prisma.slot.findMany({
    where: { id: { in: uniqueSlotIds } },
    select: { id: true, date: true, startTime: true, endTime: true, court: { select: { clubId: true } } },
  })

  if (coachId) {
    await assertCoachAvailableForSlots(coachId, slotsForCoach)
  }

  const payAtClub = body.payAtClub !== false
  const coachSessions: Awaited<ReturnType<typeof createClubCoachSession>>[] = []

  const bookings = await prisma.$transaction(async (tx) => {
    const created = []
    for (const slotId of uniqueSlotIds) {
      const claimed = await tx.slot.updateMany({
        where: { id: slotId, status: 'AVAILABLE' },
        data: { status: 'BOOKED' },
      })
      if (claimed.count === 0) {
        throw createError({ statusCode: 409, statusMessage: 'One or more slots are no longer available' })
      }

      created.push(await tx.booking.create({
        data: {
          slotId,
          source: 'CLUB',
          userId: athleteId,
          guestName: guestName || undefined,
          status: 'CONFIRMED',
          paymentStatus: payAtClub ? 'PAY_AT_CLUB' : 'PAID',
        },
        include: {
          user: { select: { name: true, email: true } },
          slot: { include: { court: { include: { club: true, sport: true } } } },
        },
      }))

      if (coachId && athleteId) {
        const slot = slotsForCoach.find((s) => s.id === slotId)
        if (slot) {
          coachSessions.push(await createClubCoachSession(tx, {
            coachId,
            athleteId,
            clubId: slot.court.clubId,
            slot,
            payAtClub,
          }))
        }
      }
    }
    return created
  })

  for (const session of coachSessions) {
    await notifyCoachOfClubSession(session)
  }

  return { count: bookings.length, bookings }
})
