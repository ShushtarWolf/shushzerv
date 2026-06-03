export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ slotId?: string }>(event)
  const slotId = body.slotId
  if (!slotId) throw createError({ statusCode: 400, statusMessage: 'slotId is required' })

  // Atomically claim the slot: only succeeds if it is still AVAILABLE.
  const booking = await prisma.$transaction(async (tx) => {
    const claimed = await tx.slot.updateMany({
      where: { id: slotId, status: 'AVAILABLE' },
      data: { status: 'BOOKED' },
    })
    if (claimed.count === 0) {
      throw createError({ statusCode: 409, statusMessage: 'Slot is no longer available' })
    }
    return tx.booking.create({
      data: { userId: user.id, slotId, status: 'CONFIRMED', paymentStatus: 'PAY_AT_CLUB' },
      include: { slot: { include: { court: { include: { club: true, sport: true } } } } },
    })
  })

  return booking
})
