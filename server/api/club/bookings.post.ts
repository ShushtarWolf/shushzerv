import {
  assertCoachAvailableForSlots,
  createClubCoachSession,
  notifyCoachOfClubSession,
} from '../../utils/clubBooking'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    slotId?: string
    coachId?: string
    guestName?: string
    athleteName?: string
    athletePhone?: string
    athleteEmail?: string
    payAtClub?: boolean
  }>(event)

  const slotId = body.slotId?.trim()
  const coachId = body.coachId?.trim() || undefined

  if (!slotId) {
    throw createError({ statusCode: 400, statusMessage: 'slotId is required' })
  }

  const { userId: athleteId, guestName } = await resolveClubBookingAthlete(body)

  if (coachId && !athleteId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Coach session requires customer phone number',
    })
  }

  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { court: { include: { club: true } } },
  })
  if (!slot || slot.status !== 'AVAILABLE') {
    throw createError({ statusCode: 409, statusMessage: 'Slot is no longer available' })
  }
  if (slot.court.club.ownerId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (coachId) {
    await assertCoachAvailableForSlots(coachId, [slot])
  }

  const payAtClub = body.payAtClub !== false
  let coachSession = null

  const booking = await prisma.$transaction(async (tx) => {
    // Atomic claim: only one concurrent request can flip AVAILABLE → BOOKED.
    const claimed = await tx.slot.updateMany({
      where: { id: slotId, status: 'AVAILABLE' },
      data: { status: 'BOOKED' },
    })
    if (claimed.count === 0) {
      throw createError({ statusCode: 409, statusMessage: 'Slot is no longer available' })
    }

    const created = await tx.booking.create({
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
    })

    if (coachId && athleteId) {
      coachSession = await createClubCoachSession(tx, {
        coachId,
        athleteId,
        clubId: slot.court.clubId,
        slot,
        payAtClub,
      })
    }

    return created
  })

  if (coachSession) {
    await notifyCoachOfClubSession(coachSession)
  }

  return booking
})
