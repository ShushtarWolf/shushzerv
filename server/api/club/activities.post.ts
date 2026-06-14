export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    clubId?: string
    titleFa?: string
    titleEn?: string
    descFa?: string
    descEn?: string
    date?: string
    startTime?: string
  }>(event)

  if (!body.clubId || !body.titleFa || !body.date || !body.startTime) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const club = await prisma.club.findFirst({ where: { id: body.clubId, ownerId: user.id } })
  if (!club) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  return prisma.clubActivity.create({
    data: {
      clubId: body.clubId,
      titleFa: body.titleFa,
      titleEn: body.titleEn || body.titleFa,
      descFa: body.descFa || '',
      descEn: body.descEn || body.descFa || '',
      date: body.date,
      startTime: body.startTime,
    },
  })
})
