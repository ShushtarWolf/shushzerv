export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const article = await prisma.newsArticle.findUnique({
    where: { slug },
    include: { sport: true },
  })

  if (!article) throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  return article
})
