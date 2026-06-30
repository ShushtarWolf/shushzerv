import { assertFindPlayersEnabled } from '../../utils/features'

export default defineEventHandler(async (event) => {
  assertFindPlayersEnabled()
  const id = getRouterParam(event, 'id')
  const session = await getUserSession(event)

  const match = await prisma.openMatch.findUnique({
    where: { id },
    include: { sport: true, club: true, creator: { select: { id: true, name: true } } },
  })
  if (!match) throw createError({ statusCode: 404, statusMessage: 'Match not found' })

  let joined = false
  if (session?.user?.id) {
    const p = await prisma.matchParticipant.findUnique({
      where: { matchId_userId: { matchId: id!, userId: session.user.id } },
    })
    joined = !!p
  }

  return { ...match, joined }
})
