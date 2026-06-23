import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ nameFa?: string; nameEn?: string; sportId?: string; indoor?: boolean; genderPolicy?: string }>(event)

  const court = await prisma.court.findUnique({ where: { id }, include: { club: true } })
  if (!court) throw createError({ statusCode: 404, statusMessage: 'Court not found' })
  await requireClubOwner(user.id, court.clubId)

  return prisma.court.update({
    where: { id },
    data: {
      ...(body.nameFa ? { nameFa: body.nameFa } : {}),
      ...(body.nameEn ? { nameEn: body.nameEn } : {}),
      ...(body.sportId ? { sportId: body.sportId } : {}),
      ...(body.indoor !== undefined ? { indoor: body.indoor } : {}),
      ...(body.genderPolicy ? { genderPolicy: body.genderPolicy as 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED' } : {}),
    },
    include: { sport: true },
  })
})
