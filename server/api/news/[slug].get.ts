export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
    include: { sport: true },
  })
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }
  return article
})
