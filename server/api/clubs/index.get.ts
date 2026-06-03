export default defineEventHandler(async (event) => {
  const { sport, city, q, featured } = getQuery(event)

  const clubs = await prisma.club.findMany({
    where: {
      ...(featured === 'true' ? { featured: true } : {}),
      ...(city ? { city: String(city) } : {}),
      ...(sport
        ? { courts: { some: { sport: { slug: String(sport) } } } }
        : {}),
      ...(q
        ? {
            OR: [
              { nameFa: { contains: String(q) } },
              { nameEn: { contains: String(q) } },
              { addressFa: { contains: String(q) } },
              { addressEn: { contains: String(q) } },
            ],
          }
        : {}),
    },
    include: { courts: { include: { sport: true } } },
    orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
  })

  return clubs
})
