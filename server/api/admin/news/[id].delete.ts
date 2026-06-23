export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  const id = getRouterParam(event, 'id')!
  await prisma.newsArticle.delete({ where: { id } })
  return { ok: true }
})
