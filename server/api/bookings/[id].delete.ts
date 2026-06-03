export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking || booking.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  await prisma.$transaction([
    prisma.booking.delete({ where: { id } }),
    prisma.slot.update({ where: { id: booking.slotId }, data: { status: 'AVAILABLE' } }),
  ])

  return { ok: true }
})
