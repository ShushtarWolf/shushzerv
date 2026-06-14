export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const memberships = await prisma.conversationMember.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          members: { include: { user: { select: { id: true, name: true } } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
  })

  const conversations = memberships
    .map((m) => ({
      id: m.conversation.id,
      titleFa: m.conversation.titleFa,
      titleEn: m.conversation.titleEn,
      isGroup: m.conversation.isGroup,
      matchId: m.conversation.matchId,
      updatedAt: m.conversation.updatedAt,
      members: m.conversation.members.map((mm) => ({ userId: mm.userId, user: mm.user })),
      lastMessage: m.conversation.messages[0] ?? null,
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return conversations
})
