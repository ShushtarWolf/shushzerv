import { mapPackage, packageInclude } from '../../../utils/classPackage'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) return []

  const packages = await prisma.classPackage.findMany({
    where: { coachId: coach.id },
    include: packageInclude,
    orderBy: { createdAt: 'desc' },
  })

  return packages.map(mapPackage)
})
