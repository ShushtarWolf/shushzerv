import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<Record<string, unknown>>(event)

  const cls = await prisma.classSession.findUnique({ where: { id } })
  if (!cls) throw createError({ statusCode: 404, statusMessage: 'Class not found' })
  await requireClubOwner(user.id, cls.clubId)

  return prisma.classSession.update({
    where: { id },
    data: {
      ...(body.titleFa ? { titleFa: String(body.titleFa) } : {}),
      ...(body.titleEn ? { titleEn: String(body.titleEn) } : {}),
      ...(body.date ? { date: String(body.date) } : {}),
      ...(body.startTime ? { startTime: String(body.startTime) } : {}),
      ...(body.endTime ? { endTime: String(body.endTime) } : {}),
      ...(body.price !== undefined ? { price: Number(body.price) } : {}),
      ...(body.maxSeats !== undefined ? { maxSeats: Number(body.maxSeats) } : {}),
      ...(body.coachId !== undefined ? { coachId: body.coachId ? String(body.coachId) : null } : {}),
      ...(body.status ? { status: body.status as 'OPEN' | 'FULL' | 'CANCELLED' } : {}),
    },
    include: { sport: true, coach: true },
  })
})
