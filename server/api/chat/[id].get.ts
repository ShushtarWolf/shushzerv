export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  })
  if (!member) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  })
  if (!conversation) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  return conversation
})
