export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { slot: { include: { court: true } } },
  })
  if (!booking || booking.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  if (booking.paymentStatus === 'PAID' && booking.slot) {
    await refundBookingToWallet(
      user.id,
      booking.id,
      booking.slot.price,
      booking.slot.court.clubId,
      true,
    )
  }

  await prisma.$transaction([
    prisma.booking.delete({ where: { id } }),
    prisma.slot.update({ where: { id: booking.slotId }, data: { status: 'AVAILABLE' } }),
  ])

  return { ok: true }
})
