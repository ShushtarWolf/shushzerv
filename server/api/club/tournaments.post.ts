import { requireClubOwner } from '../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    clubId?: string
    sportId?: string
    titleFa?: string
    titleEn?: string
    descFa?: string
    descEn?: string
    date?: string
    startTime?: string
    maxParticipants?: number
    price?: number
  }>(event)

  if (!body.clubId || !body.sportId || !body.titleFa || !body.date) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }
  await requireClubOwner(user.id, body.clubId)

  return prisma.tournament.create({
    data: {
      clubId: body.clubId,
      sportId: body.sportId,
      titleFa: body.titleFa,
      titleEn: body.titleEn ?? body.titleFa,
      descFa: body.descFa ?? '',
      descEn: body.descEn ?? '',
      date: body.date,
      startTime: body.startTime ?? '10:00',
      maxParticipants: body.maxParticipants ?? 32,
      price: body.price ?? 0,
    },
    include: { sport: true, club: true },
  })
})
