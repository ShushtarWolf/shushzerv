import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ status?: 'AVAILABLE' | 'BLOCKED' }>(event)

  const slot = await prisma.slot.findUnique({
    where: { id },
    include: { court: true, booking: true },
  })
  if (!slot) throw createError({ statusCode: 404, statusMessage: 'Slot not found' })
  await requireClubOwner(user.id, slot.court.clubId)
  if (slot.booking) throw createError({ statusCode: 409, statusMessage: 'Slot is booked' })

  const status = body.status ?? (slot.status === 'BLOCKED' ? 'AVAILABLE' : 'BLOCKED')
  return prisma.slot.update({ where: { id }, data: { status } })
})
