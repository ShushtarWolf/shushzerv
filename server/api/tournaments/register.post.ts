export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ tournamentId?: string }>(event)

  if (!body.tournamentId) throw createError({ statusCode: 400, statusMessage: 'tournamentId required' })

  const tournament = await prisma.tournament.findUnique({ where: { id: body.tournamentId } })
  if (!tournament || tournament.status !== 'OPEN') {
    throw createError({ statusCode: 400, statusMessage: 'Tournament not available' })
  }
  if (tournament.joinedCount >= tournament.maxParticipants) {
    throw createError({ statusCode: 409, statusMessage: 'Tournament full' })
  }

  const existing = await prisma.tournamentRegistration.findUnique({
    where: { tournamentId_userId: { tournamentId: body.tournamentId, userId: user.id } },
  })
  if (existing) throw createError({ statusCode: 409, statusMessage: 'Already registered' })

  const [registration] = await prisma.$transaction([
    prisma.tournamentRegistration.create({
      data: { tournamentId: body.tournamentId, userId: user.id },
      include: { tournament: { include: { sport: true, club: true } } },
    }),
    prisma.tournament.update({
      where: { id: body.tournamentId },
      data: {
        joinedCount: { increment: 1 },
        status: tournament.joinedCount + 1 >= tournament.maxParticipants ? 'FULL' : 'OPEN',
      },
    }),
  ])

  return registration
})
