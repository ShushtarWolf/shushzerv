export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    slotId?: string
    guestName?: string
    athleteName?: string
    athletePhone?: string
    athleteEmail?: string
    payAtClub?: boolean
  }>(event)

  const slotId = body.slotId?.trim()

  if (!slotId) {
    throw createError({ statusCode: 400, statusMessage: 'slotId is required' })
  }

  const { userId: athleteId, guestName } = await resolveClubBookingAthlete(body)

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

  const booking = await prisma.$transaction(async (tx) => {
    // Atomic claim: only one concurrent request can flip AVAILABLE → BOOKED.
    const claimed = await tx.slot.updateMany({
      where: { id: slotId, status: 'AVAILABLE' },
      data: { status: 'BOOKED' },
    })
    if (claimed.count === 0) {
      throw createError({ statusCode: 409, statusMessage: 'Slot is no longer available' })
    }

    return tx.booking.create({
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
    })
  })

  return booking
})
