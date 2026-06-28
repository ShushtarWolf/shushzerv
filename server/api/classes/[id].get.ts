import { mapClassParticipants } from '../../utils/classSession'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const session = await getUserSession(event)

  const classSession = await prisma.classSession.findUnique({
    where: { id },
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
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!classSession) {
    throw createError({ statusCode: 404, statusMessage: 'Class not found' })
  }

  let enrolled = false
  if (session?.user?.id) {
    const e = await prisma.classEnrollment.findUnique({
      where: { userId_classSessionId: { userId: session.user.id, classSessionId: id! } },
    })
    enrolled = !!e
  }

  const { enrollments, ...rest } = classSession

  return {
    ...rest,
    enrolled,
    participants: mapClassParticipants(enrollments),
  }
})
