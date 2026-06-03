export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sport = typeof query.sport === 'string' && query.sport ? query.sport : undefined

  return prisma.coach.findMany({
    where: sport ? { sport: { slug: sport } } : undefined,
    include: { sport: true },
    orderBy: { rating: 'desc' },
  })
})
