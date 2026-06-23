export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'ATHLETE')

  const enrollments = await prisma.classEnrollment.findMany({
    where: { userId: user.id },
    include: {
      classSession: { include: { sport: true, club: true, coach: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return enrollments.map((e) => ({
    id: e.id,
    paymentStatus: e.paymentStatus,
    createdAt: e.createdAt,
    classSession: e.classSession,
  }))
})
