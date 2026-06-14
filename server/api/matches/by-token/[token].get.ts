export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, statusMessage: 'token required' })

  const match = await prisma.openMatch.findUnique({
    where: { shareToken: token },
    include: {
      sport: true,
      club: true,
      creator: { select: { id: true, name: true } },
    },
  })
  if (!match) throw createError({ statusCode: 404, statusMessage: 'Match not found' })

  const session = await getUserSession(event)
  const userId = session?.user?.id
  if (!userId) return { ...match, joined: false }

  const joined = await prisma.matchParticipant.findUnique({
    where: { matchId_userId: { matchId: match.id, userId } },
  })
  return { ...match, joined: !!joined }
})
