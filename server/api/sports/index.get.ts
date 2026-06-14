export default defineEventHandler(async () => {
  const sports = await prisma.sport.findMany({
    orderBy: { nameEn: 'asc' },
    include: { _count: { select: { courts: true } } },
  })
  return sports.map(({ _count, ...sport }) => ({
    ...sport,
    courtCount: _count.courts,
  }))
})
