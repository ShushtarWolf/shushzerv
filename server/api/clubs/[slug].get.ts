export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const club = await prisma.club.findUnique({
    where: { slug },
    include: {
      courts: { include: { sport: true } },
    },
  })

  if (!club) throw createError({ statusCode: 404, statusMessage: 'Club not found' })

  return {
    ...club,
    sports: Array.from(new Map(club.courts.map((c) => [c.sport.id, c.sport])).values()),
  }
})
