export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<Record<string, string>>(event)

  return prisma.newsArticle.update({
    where: { id },
    data: {
      ...(body.titleFa ? { titleFa: body.titleFa } : {}),
      ...(body.titleEn ? { titleEn: body.titleEn } : {}),
      ...(body.excerptFa ? { excerptFa: body.excerptFa } : {}),
      ...(body.excerptEn ? { excerptEn: body.excerptEn } : {}),
      ...(body.bodyFa ? { bodyFa: body.bodyFa } : {}),
      ...(body.bodyEn ? { bodyEn: body.bodyEn } : {}),
      ...(body.date ? { date: body.date } : {}),
    },
    include: { sport: true },
  })
})
