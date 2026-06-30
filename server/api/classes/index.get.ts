import { mapClassParticipants } from '../../utils/classSession'
import { assertGroupClassesPublicAccess } from '../../utils/features'
import { entitySportWhere } from '../../utils/visibleSports'

export default defineEventHandler(async (event) => {
  await assertGroupClassesPublicAccess(event)
  const { sport, city, clubId, classType, genderPolicy } = getQuery(event)
  const sportFilter = entitySportWhere(sport)
  if (sportFilter === null) return []

  const session = await getUserSession(event)
  const userId = session?.user?.id

  const classes = await prisma.classSession.findMany({
    where: {
      status: { not: 'CANCELLED' },
      ...sportFilter,
      ...(city ? { club: { city: String(city) } } : {}),
      ...(clubId ? { clubId: String(clubId) } : {}),
      ...(classType ? { classType: String(classType) as 'GROUP' | 'SEMI_PRIVATE' } : {}),
      ...(genderPolicy ? { genderPolicy: String(genderPolicy) as 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED' } : {}),
    },
    include: {
      club: true,
      sport: true,
      coach: true,
      enrollments: {
        include: {
          user: {
            select: {
              name: true,
              gender: true,
              athleteProfile: { select: { level: true } },
            },
          },
        },
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  const mapped = classes.map((c) => ({
    ...c,
    participants: mapClassParticipants(c.enrollments),
    enrollments: undefined,
  }))

  if (!userId) return mapped

  const enrollments = await prisma.classEnrollment.findMany({
    where: { userId, classSessionId: { in: classes.map((c) => c.id) } },
    select: { classSessionId: true },
  })
  const enrolledIds = new Set(enrollments.map((e) => e.classSessionId))

  return mapped.map((c) => ({ ...c, enrolled: enrolledIds.has(c.id) }))
})
