export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const id = getRouterParam(event, 'id')!

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach profile not found' })

  const item = await prisma.coachEquipment.findUnique({ where: { id } })
  if (!item || item.coachId !== coach.id) {
    throw createError({ statusCode: 404, statusMessage: 'Equipment not found' })
  }

  await prisma.coachEquipment.delete({ where: { id } })
  return { ok: true }
})
