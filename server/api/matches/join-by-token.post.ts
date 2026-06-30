import { assertFindPlayersEnabled } from '../../utils/features'

export default defineEventHandler(async (event) => {
  assertFindPlayersEnabled()
  const user = await requireRole(event, 'ATHLETE')
  const body = await readBody<{ token?: string }>(event)
  if (!body.token) throw createError({ statusCode: 400, statusMessage: 'token required' })

  const match = await prisma.openMatch.findUnique({ where: { shareToken: body.token } })
  if (!match || match.status === 'CANCELLED' || match.status === 'COMPLETED') {
    throw createError({ statusCode: 404, statusMessage: 'Match not found' })
  }

  const existing = await prisma.matchParticipant.findUnique({
    where: { matchId_userId: { matchId: match.id, userId: user.id } },
  })
  if (existing) return { ok: true, matchId: match.id, alreadyJoined: true }

  if (match.joinedCount >= match.maxPlayers) {
    throw createError({ statusCode: 409, statusMessage: 'Match is full' })
  }

  await prisma.$transaction([
    prisma.matchParticipant.create({ data: { matchId: match.id, userId: user.id } }),
    prisma.openMatch.update({
      where: { id: match.id },
      data: {
        joinedCount: { increment: 1 },
        status: match.joinedCount + 1 >= match.maxPlayers ? 'FULL' : 'OPEN',
      },
    }),
  ])

  const conversation = await prisma.conversation.findFirst({ where: { matchId: match.id } })
  if (conversation) {
    await prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId: user.id } },
      create: { conversationId: conversation.id, userId: user.id },
      update: {},
    })
  }

  await awardXp(user.id, 'joinMatch')

  return { ok: true, matchId: match.id }
})
