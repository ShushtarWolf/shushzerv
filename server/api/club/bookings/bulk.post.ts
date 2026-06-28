import { generateSlotsForCourtDate, resolveSlotGenerationParams } from '../../../utils/clubSlots'

type ReservationInput =
  | { slotId: string }
  | { courtId: string; date: string; startTime: string; endTime: string }

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    slotIds?: string[]
    reservations?: ReservationInput[]
    guestName?: string
    athleteEmail?: string
    payAtClub?: boolean
  }>(event)

  const guestName = body.guestName?.trim()
  const athleteEmail = body.athleteEmail?.trim().toLowerCase()

  if (!guestName && !athleteEmail) {
    throw createError({ statusCode: 400, statusMessage: 'guestName or athleteEmail is required' })
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

  let athleteId: string | undefined
  if (athleteEmail) {
    const athlete = await prisma.user.findUnique({ where: { email: athleteEmail } })
    if (!athlete) throw createError({ statusCode: 404, statusMessage: 'User not found' })
    athleteId = athlete.id
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
          paymentStatus: body.payAtClub === false ? 'PAID' : 'PAY_AT_CLUB',
        },
        include: {
          user: { select: { name: true, email: true } },
          slot: { include: { court: { include: { club: true, sport: true } } } },
        },
      }))
    }
    return created
  })

  return { count: bookings.length, bookings }
})
