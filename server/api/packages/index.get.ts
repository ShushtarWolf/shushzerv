import { packageInclude, mapPackage } from '../../utils/classPackage'
import { assertGroupClassesPublicAccess } from '../../utils/features'
import { entitySportWhere } from '../../utils/visibleSports'

export default defineEventHandler(async (event) => {
  await assertGroupClassesPublicAccess(event)
  const { sport, city, clubId, coachId, classType, featured, groupMode } = getQuery(event)
  const sportFilter = entitySportWhere(sport)
  if (sportFilter === null) return []

  const packages = await prisma.classPackage.findMany({
    where: {
      status: 'ACTIVE',
      ...sportFilter,
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
