export default defineEventHandler(async (event) => {
  const { sport } = getQuery(event)
  return prisma.coach.findMany({
    where: sport ? { sport: { slug: String(sport) } } : {},
    include: { sport: true },
    orderBy: { rating: 'desc' },
  })
})
