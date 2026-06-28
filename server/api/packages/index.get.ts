import { packageInclude, mapPackage } from '../../utils/classPackage'

export default defineEventHandler(async (event) => {
  const { sport, city, clubId, coachId, classType, featured, groupMode } = getQuery(event)

  const packages = await prisma.classPackage.findMany({
    where: {
      status: 'ACTIVE',
      ...(sport ? { sport: { slug: String(sport) } } : {}),
      ...(city ? { OR: [{ club: { city: String(city) } }, { coach: { city: String(city) } }] } : {}),
      ...(clubId ? { clubId: String(clubId) } : {}),
      ...(coachId ? { coachId: String(coachId) } : {}),
      ...(classType ? { classType: String(classType) as 'GROUP' | 'SEMI_PRIVATE' } : {}),
      ...(groupMode ? { groupMode: String(groupMode) as 'OPEN' | 'WITH_STUDENTS' } : {}),
      ...(featured === 'true' ? { featured: true } : {}),
    },
    include: packageInclude,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  })

  return packages.map(mapPackage)
})
