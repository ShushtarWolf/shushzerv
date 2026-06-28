import { assertCanEnrollInClass } from '../../utils/classSession'
import { payClassFromWallet } from '../../utils/wallet'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'ATHLETE')
  const { classSessionId, payWithWallet } = await readBody<{ classSessionId?: string; payWithWallet?: boolean }>(event)
  if (!classSessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing classSessionId' })
  }

  const classSession = await prisma.classSession.findUnique({
    where: { id: classSessionId },
    include: { coach: { select: { userId: true } } },
  })
  if (!classSession) {
    throw createError({ statusCode: 404, statusMessage: 'Class not found' })
  }

  await assertCanEnrollInClass(user.id, classSession)

  const existing = await prisma.classEnrollment.findUnique({
    where: { userId_classSessionId: { userId: user.id, classSessionId } },
  })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Already enrolled' })
  }

  const useWallet = payWithWallet === true

  await prisma.$transaction(async (tx) => {
    await tx.classEnrollment.create({
      data: {
        userId: user.id,
        classSessionId,
        paymentStatus: useWallet ? 'PAID' : 'PAY_AT_CLUB',
      },
    })
    await tx.classSession.update({
      where: { id: classSessionId },
      data: {
        bookedSeats: { increment: 1 },
        status: classSession.bookedSeats + 1 >= classSession.maxSeats ? 'FULL' : 'OPEN',
      },
    })
  })

  if (useWallet) {
    await payClassFromWallet(
      user.id,
      classSessionId,
      classSession.price,
      classSession.clubId,
      classSession.coach?.userId,
    )
  }

  return { ok: true }
})
