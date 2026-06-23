export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach not found' })

  const assignment = await prisma.planAssignment.findUnique({
    where: { id },
    include: { plan: true },
  })
  if (!assignment || assignment.plan.coachId !== coach.id) {
    throw createError({ statusCode: 404, statusMessage: 'Assignment not found' })
  }

  await prisma.planAssignment.delete({ where: { id } })
  return { ok: true }
})
