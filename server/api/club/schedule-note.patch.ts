import { requireClubOwner } from '../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    type?: 'slot' | 'booking' | 'class'
    id?: string
    note?: string
  }>(event)

  if (!body.type || !body.id) {
    throw createError({ statusCode: 400, statusMessage: 'type and id are required' })
  }

  const note = body.note?.trim() ?? ''

  if (body.type === 'slot') {
    const slot = await prisma.slot.findUnique({
      where: { id: body.id },
      include: { court: true },
    })
    if (!slot) throw createError({ statusCode: 404, statusMessage: 'Slot not found' })
    await requireClubOwner(user.id, slot.court.clubId)
    return prisma.slot.update({
      where: { id: body.id },
      data: { ownerNote: note || null },
    })
  }

  if (body.type === 'booking') {
    const booking = await prisma.booking.findUnique({
      where: { id: body.id },
      include: { slot: { include: { court: true } } },
    })
    if (!booking?.slot) throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
    await requireClubOwner(user.id, booking.slot.court.clubId)
    return prisma.booking.update({
      where: { id: body.id },
      data: { ownerNote: note || null },
    })
  }

  const cls = await prisma.classSession.findUnique({ where: { id: body.id } })
  if (!cls) throw createError({ statusCode: 404, statusMessage: 'Class not found' })
  await requireClubOwner(user.id, cls.clubId)
  return prisma.classSession.update({
    where: { id: body.id },
    data: { clubNote: note || null },
  })
})
