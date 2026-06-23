export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const club = await prisma.club.findUnique({
    where: { slug },
    include: {
      courts: { include: { sport: true, addons: true } },
      activities: { orderBy: { date: 'asc' } },
      addons: true,
    },
  })
  if (!club) {
    throw createError({ statusCode: 404, statusMessage: 'Club not found' })
  }
  return club
})
