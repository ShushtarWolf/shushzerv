export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!

  const notification = await prisma.notification.findFirst({ where: { id, userId: user.id } })
  if (!notification) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  return prisma.notification.update({ where: { id }, data: { readAt: new Date() } })
})
