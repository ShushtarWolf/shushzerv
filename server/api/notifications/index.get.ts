export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { unreadOnly } = getQuery(event)

  return prisma.notification.findMany({
    where: {
      userId: user.id,
      ...(unreadOnly === '1' ? { readAt: null } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
})
