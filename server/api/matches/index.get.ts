export default defineEventHandler(async (event) => {
  const { sport, city } = getQuery(event)
  const session = await getUserSession(event)
  const userId = session?.user?.id

  const matches = await prisma.openMatch.findMany({
    where: {
      status: { in: ['OPEN', 'FULL'] },
      ...(sport ? { sport: { slug: String(sport) } } : {}),
      ...(city ? { city: String(city) } : {}),
    },
    include: {
      sport: true,
      club: true,
      creator: { select: { id: true, name: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  if (!userId) return matches

  const joined = await prisma.matchParticipant.findMany({
    where: { userId, matchId: { in: matches.map((m) => m.id) } },
    select: { matchId: true },
  })
  const joinedIds = new Set(joined.map((j) => j.matchId))

  return matches.map((m) => ({ ...m, joined: joinedIds.has(m.id) }))
})
