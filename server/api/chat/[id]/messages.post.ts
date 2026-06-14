export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const body = await readBody<{ body?: string }>(event)
  const text = body.body?.trim()
  if (!text) throw createError({ statusCode: 400, statusMessage: 'Empty message' })

  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  })
  if (!member) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: user.id, body: text.slice(0, 2000) },
    include: { sender: { select: { id: true, name: true } } },
  })

  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } })

  return message
})
