export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'ATHLETE')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ completed?: boolean; notes?: string }>(event)

  const assignment = await prisma.planAssignment.findUnique({
    where: { id },
    include: { plan: true },
  })
  if (!assignment || assignment.athleteId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Assignment not found' })
  }

  const data: { completedAt?: Date | null; notes?: string } = {}
  if (body.completed !== undefined) {
    data.completedAt = body.completed ? new Date() : null
  }
  if (body.notes !== undefined) data.notes = body.notes

  return prisma.planAssignment.update({
    where: { id },
    data,
    include: { plan: { include: { coach: true, sport: true } } },
  })
})
