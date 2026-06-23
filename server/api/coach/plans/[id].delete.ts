export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const id = getRouterParam(event, 'id')!

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach not found' })

  const plan = await prisma.trainingPlan.findFirst({ where: { id, coachId: coach.id } })
  if (!plan) throw createError({ statusCode: 404, statusMessage: 'Plan not found' })

  await prisma.trainingPlan.delete({ where: { id } })
  return { ok: true }
})
