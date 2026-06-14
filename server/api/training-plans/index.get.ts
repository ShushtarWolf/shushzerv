export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  if (session.user.role === 'ATHLETE') {
    const assignments = await prisma.planAssignment.findMany({
      where: { athleteId: session.user.id },
      include: { plan: { include: { coach: true, sport: true } } },
    })
    return assignments.map((a) => a.plan)
  }

  if (session.user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
    if (!coach) return []
    return prisma.trainingPlan.findMany({
      where: { coachId: coach.id },
      include: { sport: true, assignments: { include: { athlete: { select: { id: true, name: true } } } } },
    })
  }

  return []
})
