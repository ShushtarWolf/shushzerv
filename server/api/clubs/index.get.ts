export default defineEventHandler(async (event) => {
  const { sport, city, q, featured, indoor, date, genderPolicy } = getQuery(event)

  const clubs = await prisma.club.findMany({
    where: {
      ...(featured === 'true' ? { featured: true } : {}),
      ...(city ? { city: String(city) } : {}),
      ...(sport
        ? { courts: { some: { sport: { slug: String(sport) } } } }
        : {}),
      ...(indoor === 'true' ? { courts: { some: { indoor: true } } } : {}),
      ...(indoor === 'false' ? { courts: { some: { indoor: false } } } : {}),
      ...(genderPolicy ? { courts: { some: { genderPolicy: String(genderPolicy) as 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED' } } } : {}),
      ...(date
        ? { courts: { some: { slots: { some: { date: String(date), status: 'AVAILABLE' } } } } }
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
    include: { courts: { include: { sport: true } }, addons: true },
    orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
  })

  return clubs
})
