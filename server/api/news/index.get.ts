export default defineEventHandler(async () => {
  return prisma.newsArticle.findMany({
    include: { sport: true },
    orderBy: { date: 'desc' },
  })
})
