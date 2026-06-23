export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Tournament id required' })

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      sport: true,
      club: true,
      _count: { select: { registrations: true } },
    },
  })

  if (!tournament) {
    throw createError({ statusCode: 404, statusMessage: 'Tournament not found' })
  }

  return {
    ...tournament,
    joinedCount: tournament._count.registrations,
  }
})
