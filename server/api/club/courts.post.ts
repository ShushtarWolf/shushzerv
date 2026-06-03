export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{ clubId?: string; nameFa?: string; nameEn?: string; sportId?: string; surface?: string }>(event)

  if (!body.clubId || !body.nameFa || !body.nameEn || !body.sportId) {
    throw createError({ statusCode: 400, statusMessage: 'clubId, names and sportId are required' })
  }

  const club = await prisma.club.findFirst({ where: { id: body.clubId, ownerId: user.id } })
  if (!club) throw createError({ statusCode: 403, statusMessage: 'Not your club' })

  return prisma.court.create({
    data: {
      clubId: body.clubId,
      nameFa: body.nameFa,
      nameEn: body.nameEn,
      sportId: body.sportId,
      surface: body.surface || null,
    },
    include: { sport: true },
  })
})
