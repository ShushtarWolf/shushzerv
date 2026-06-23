export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  return prisma.newsArticle.findMany({
    include: { sport: true },
    orderBy: { date: 'desc' },
  })
})
