import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{
    titleFa?: string
    titleEn?: string
    descFa?: string
    descEn?: string
    date?: string
    startTime?: string
    maxParticipants?: number
    price?: number
    status?: 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED'
    sportId?: string
  }>(event)

  const tournament = await prisma.tournament.findUnique({ where: { id } })
  if (!tournament?.clubId) throw createError({ statusCode: 404, statusMessage: 'Tournament not found' })
  await requireClubOwner(user.id, tournament.clubId)

  if (body.maxParticipants !== undefined && body.maxParticipants < tournament.joinedCount) {
    throw createError({ statusCode: 400, statusMessage: 'Max participants below current registrations' })
  }

  return prisma.tournament.update({
    where: { id },
    data: {
      ...(body.titleFa ? { titleFa: body.titleFa } : {}),
      ...(body.titleEn ? { titleEn: body.titleEn } : {}),
      ...(body.descFa !== undefined ? { descFa: body.descFa } : {}),
      ...(body.descEn !== undefined ? { descEn: body.descEn } : {}),
      ...(body.date ? { date: body.date } : {}),
      ...(body.startTime ? { startTime: body.startTime } : {}),
      ...(body.maxParticipants !== undefined ? { maxParticipants: body.maxParticipants } : {}),
      ...(body.price !== undefined ? { price: Math.round(body.price) } : {}),
      ...(body.sportId ? { sportId: body.sportId } : {}),
      ...(body.status ? { status: body.status } : {}),
    },
    include: { sport: true, club: true, _count: { select: { registrations: true } } },
  })
})
