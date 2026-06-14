export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const session = await getUserSession(event)

  const classSession = await prisma.classSession.findUnique({
    where: { id },
    include: { club: true, sport: true, coach: true },
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

  return { ...classSession, enrolled }
})
