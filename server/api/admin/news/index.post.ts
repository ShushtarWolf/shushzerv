export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  const body = await readBody<{
    slug?: string
    titleFa?: string
    titleEn?: string
    excerptFa?: string
    excerptEn?: string
    bodyFa?: string
    bodyEn?: string
    date?: string
    sportId?: string
  }>(event)

  if (!body.slug || !body.titleFa || !body.titleEn) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  return prisma.newsArticle.create({
    data: {
      slug: body.slug,
      titleFa: body.titleFa,
      titleEn: body.titleEn,
      excerptFa: body.excerptFa ?? body.titleFa,
      excerptEn: body.excerptEn ?? body.titleEn,
      bodyFa: body.bodyFa ?? body.titleFa,
      bodyEn: body.bodyEn ?? body.titleEn,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      sportId: body.sportId || null,
    },
    include: { sport: true },
  })
})
