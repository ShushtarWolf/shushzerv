import { createNotification } from './notifications'
import { refundCoachSessionToWallet } from './wallet'

export function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd
}

export async function assertCoachSlotAvailable(
  coachId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeSessionId?: string,
) {
  if (startTime >= endTime) {
    throw createError({ statusCode: 400, statusMessage: 'End time must be after start time' })
  }

  const [sessions, classes] = await Promise.all([
    prisma.coachSession.findMany({
      where: {
        coachId,
        date,
        status: { not: 'CANCELLED' },
        ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
      },
    }),
    prisma.classSession.findMany({
      where: {
        coachId,
        date,
        status: { not: 'CANCELLED' },
      },
    }),
  ])

  for (const session of sessions) {
    if (timeRangesOverlap(startTime, endTime, session.startTime, session.endTime)) {
      throw createError({ statusCode: 409, statusMessage: 'Time slot conflicts with existing session' })
    }
  }

  for (const cls of classes) {
    if (timeRangesOverlap(startTime, endTime, cls.startTime, cls.endTime)) {
      throw createError({ statusCode: 409, statusMessage: 'Time slot conflicts with a class' })
    }
  }
}

export async function incrementCoachSessionCount(coachId: string) {
  await prisma.coach.update({
    where: { id: coachId },
    data: { sessions: { increment: 1 } },
  })
}

export async function decrementCoachSessionCount(coachId: string) {
  const coach = await prisma.coach.findUnique({ where: { id: coachId }, select: { sessions: true } })
  if (!coach || coach.sessions <= 0) return
  await prisma.coach.update({
    where: { id: coachId },
    data: { sessions: { decrement: 1 } },
  })
}

type CoachSessionCancelRow = {
  id: string
  coachId: string
  athleteId: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  paymentStatus: 'PAY_AT_CLUB' | 'PAID'
  price: number
  coach: { userId: string | null; nameFa: string; nameEn: string }
  athlete: { name: string; nameEn: string | null }
}

export async function cancelCoachSession(
  session: CoachSessionCancelRow,
  cancelledBy: 'coach' | 'athlete',
) {
  if (session.status === 'CANCELLED') return session

  if (session.paymentStatus === 'PAID' && session.coach.userId) {
    await refundCoachSessionToWallet(
      session.athleteId,
      session.coach.userId,
      session.id,
      session.price,
    )
  }

  const updated = await prisma.coachSession.update({
    where: { id: session.id },
    data: { status: 'CANCELLED' },
    include: {
      coach: { include: { sport: true } },
      club: true,
      athlete: { select: { id: true, name: true, nameEn: true, email: true } },
    },
  })

  if (session.status === 'CONFIRMED') {
    await decrementCoachSessionCount(session.coachId)
  }

  if (cancelledBy === 'athlete' && session.coach.userId) {
    await createNotification(session.coach.userId, {
      type: 'BOOKING',
      titleFa: 'جلسه لغو شد',
      titleEn: 'Session cancelled',
      bodyFa: `${session.athlete.name} جلسه را لغو کرد`,
      bodyEn: `${session.athlete.nameEn ?? session.athlete.name} cancelled the session`,
      link: '/dashboard/coach?tab=schedule',
    })
  }

  if (cancelledBy === 'coach') {
    await createNotification(session.athleteId, {
      type: 'BOOKING',
      titleFa: 'جلسه لغو شد',
      titleEn: 'Session cancelled',
      bodyFa: `مربی ${session.coach.nameFa} جلسه را لغو کرد`,
      bodyEn: `Coach ${session.coach.nameEn} cancelled the session`,
      link: '/dashboard?tab=bookings',
    })
  }

  return updated
}
