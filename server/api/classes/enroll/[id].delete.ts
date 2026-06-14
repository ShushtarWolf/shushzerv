export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'ATHLETE')
  const classSessionId = getRouterParam(event, 'id')

  const enrollment = await prisma.classEnrollment.findUnique({
    where: { userId_classSessionId: { userId: user.id, classSessionId: classSessionId! } },
  })
  if (!enrollment) {
    throw createError({ statusCode: 404, statusMessage: 'Enrollment not found' })
  }

  await prisma.$transaction([
    prisma.classEnrollment.delete({ where: { id: enrollment.id } }),
    prisma.classSession.update({
      where: { id: classSessionId! },
      data: { bookedSeats: { decrement: 1 }, status: 'OPEN' },
    }),
  ])

  return { ok: true }
})
