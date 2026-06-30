import { assertFindPlayersEnabled } from '../../../utils/features'

export default defineEventHandler(async (event) => {
  assertFindPlayersEnabled()
  const user = await requireRole(event, 'ATHLETE')
  const matchId = getRouterParam(event, 'id')

  const match = await prisma.openMatch.findUnique({ where: { id: matchId } })
  if (!match || match.status === 'CANCELLED' || match.status === 'COMPLETED') {
    throw createError({ statusCode: 404, statusMessage: 'Match not found' })
  }
  if (match.joinedCount >= match.maxPlayers) {
    throw createError({ statusCode: 409, statusMessage: 'Match is full' })
  }

  const existing = await prisma.matchParticipant.findUnique({
    where: { matchId_userId: { matchId: matchId!, userId: user.id } },
  })
  if (existing) throw createError({ statusCode: 409, statusMessage: 'Already joined' })

  await prisma.$transaction([
    prisma.matchParticipant.create({ data: { matchId: matchId!, userId: user.id } }),
    prisma.openMatch.update({
      where: { id: matchId! },
      data: {
        joinedCount: { increment: 1 },
        status: match.joinedCount + 1 >= match.maxPlayers ? 'FULL' : 'OPEN',
      },
    }),
  ])

  // Add joiner to the match conversation if one exists.
  const conversation = await prisma.conversation.findFirst({ where: { matchId: matchId! } })
  if (conversation) {
    await prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId: user.id } },
      create: { conversationId: conversation.id, userId: user.id },
      update: {},
    })
  }

  await awardXp(user.id, 'joinMatch')

  return { ok: true }
})
