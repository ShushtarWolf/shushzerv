import { assertFindPlayersEnabled } from '../../../utils/features'

export default defineEventHandler(async (event) => {
  assertFindPlayersEnabled()
  const user = await requireRole(event, 'ATHLETE')
  const matchId = getRouterParam(event, 'id')

  const match = await prisma.openMatch.findUnique({ where: { id: matchId } })
  if (!match) throw createError({ statusCode: 404, statusMessage: 'Match not found' })

  const participant = await prisma.matchParticipant.findUnique({
    where: { matchId_userId: { matchId: matchId!, userId: user.id } },
  })
  if (!participant) throw createError({ statusCode: 404, statusMessage: 'Not a participant' })

  const isCreator = match.creatorId === user.id
  if (isCreator && match.joinedCount <= 1) {
    await prisma.openMatch.update({ where: { id: matchId! }, data: { status: 'CANCELLED' } })
    return { ok: true }
  }

  await prisma.$transaction([
    prisma.matchParticipant.delete({ where: { id: participant.id } }),
    prisma.openMatch.update({
      where: { id: matchId! },
      data: { joinedCount: { decrement: 1 }, status: 'OPEN' },
    }),
  ])

  return { ok: true }
})
