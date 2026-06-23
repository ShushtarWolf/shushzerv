export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) return []

  return prisma.coachEquipment.findMany({
    where: { coachId: coach.id },
    orderBy: { nameFa: 'asc' },
  })
})
