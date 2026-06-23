import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ status?: 'CONFIRMED' | 'CANCELLED'; paymentStatus?: 'PAY_AT_CLUB' | 'PAID' }>(event)

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { slot: { include: { court: true } } },
  })
  if (!booking?.slot) throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  await requireClubOwner(user.id, booking.slot.court.clubId)

  if (body.status === 'CANCELLED') {
    await prisma.$transaction([
      prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } }),
      prisma.slot.update({ where: { id: booking.slotId }, data: { status: 'AVAILABLE' } }),
    ])
    return { ok: true, status: 'CANCELLED' }
  }

  return prisma.booking.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.paymentStatus ? { paymentStatus: body.paymentStatus } : {}),
    },
  })
})
