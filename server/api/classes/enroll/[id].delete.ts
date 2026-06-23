export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'ATHLETE')
  const classSessionId = getRouterParam(event, 'id')

  const enrollment = await prisma.classEnrollment.findUnique({
    where: { userId_classSessionId: { userId: user.id, classSessionId: classSessionId! } },
    include: {
      classSession: { include: { coach: { select: { userId: true } } } },
    },
  })
  if (!enrollment) {
    throw createError({ statusCode: 404, statusMessage: 'Enrollment not found' })
  }

  const classSession = enrollment.classSession
  if (enrollment.paymentStatus === 'PAID' && classSession) {
    await refundClassFromWallet(
      user.id,
      classSessionId!,
      classSession.price,
      classSession.clubId,
      classSession.coach?.userId,
    )
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
