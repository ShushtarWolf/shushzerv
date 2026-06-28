export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach profile not found' })

  const existing = await prisma.classPackage.findFirst({ where: { id, coachId: coach.id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  await prisma.classPackage.delete({ where: { id } })
  return { ok: true }
})
