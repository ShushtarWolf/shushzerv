export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sport = typeof query.sport === 'string' && query.sport ? query.sport : undefined
  const city = typeof query.city === 'string' && query.city ? query.city : undefined
  const featured = query.featured === 'true' ? true : undefined

  const clubs = await prisma.club.findMany({
    where: {
      ...(city ? { city } : {}),
      ...(featured ? { featured: true } : {}),
      ...(sport ? { courts: { some: { sport: { slug: sport } } } } : {}),
    },
    include: {
      courts: { include: { sport: true } },
    },
    orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
  })

  return clubs.map((club) => ({
    ...club,
    sports: Array.from(new Map(club.courts.map((c) => [c.sport.id, c.sport])).values()),
  }))
})
