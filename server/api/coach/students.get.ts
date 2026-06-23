export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) return []

  const assignments = await prisma.planAssignment.findMany({
    where: { plan: { coachId: coach.id } },
    include: {
      athlete: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          email: true,
          athleteProfile: { include: { sport: true } },
        },
      },
      plan: { select: { id: true, titleFa: true, titleEn: true, planType: true } },
    },
    orderBy: { assignedAt: 'desc' },
  })

  const seen = new Map<string, (typeof assignments)[0]>()
  for (const a of assignments) {
    if (!seen.has(a.athleteId)) seen.set(a.athleteId, a)
  }

  return Array.from(seen.values()).map((a) => ({
    id: a.id,
    assignmentId: a.id,
    assignedAt: a.assignedAt,
    completedAt: a.completedAt,
    notes: a.notes,
    athlete: a.athlete,
    plan: a.plan,
  }))
})
