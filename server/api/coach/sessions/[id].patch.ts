import {
  assertCoachSlotAvailable,
  cancelCoachSession,
  incrementCoachSessionCount,
} from '../../../utils/coachSession'
import { createNotification } from '../../../utils/notifications'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody<{
    status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
    date?: string
    startTime?: string
    endTime?: string
  }>(event)

  const session = await prisma.coachSession.findUnique({
    where: { id },
    include: {
      coach: { select: { id: true, userId: true, nameFa: true, nameEn: true } },
      athlete: { select: { id: true, name: true, nameEn: true } },
    },
  })
  if (!session) throw createError({ statusCode: 404, statusMessage: 'Session not found' })

  const coachOwner = user.role === 'COACH' && session.coach.userId === user.id
  const isAthlete = session.athleteId === user.id

  if (!coachOwner && !isAthlete) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (body.status === 'CANCELLED') {
    return cancelCoachSession(session, coachOwner ? 'coach' : 'athlete')
  }

  if (!coachOwner) {
    throw createError({ statusCode: 403, statusMessage: 'Only the coach can update this session' })
  }

  if (body.status === 'CONFIRMED') {
    if (session.status !== 'PENDING') {
      throw createError({ statusCode: 409, statusMessage: 'Session is not pending confirmation' })
    }

    const updated = await prisma.coachSession.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        coach: { include: { sport: true } },
        club: true,
        athlete: { select: { id: true, name: true, nameEn: true, email: true } },
      },
    })

    await incrementCoachSessionCount(session.coachId)

    await createNotification(session.athleteId, {
      type: 'BOOKING',
      titleFa: 'جلسه مربی تأیید شد',
      titleEn: 'Coach session confirmed',
      bodyFa: `${session.coach.nameFa} جلسه را تأیید کرد`,
      bodyEn: `${session.coach.nameEn} confirmed your session`,
      link: '/dashboard?tab=bookings',
    })

    return updated
  }

  const date = body.date ?? session.date
  const startTime = body.startTime ?? session.startTime
  const endTime = body.endTime ?? session.endTime

  if (date !== session.date || startTime !== session.startTime || endTime !== session.endTime) {
    if (session.status === 'CANCELLED') {
      throw createError({ statusCode: 409, statusMessage: 'Cannot reschedule a cancelled session' })
    }

    await assertCoachSlotAvailable(session.coachId, date, startTime, endTime, id)

    const updated = await prisma.coachSession.update({
      where: { id },
      data: { date, startTime, endTime },
      include: {
        coach: { include: { sport: true } },
        club: true,
        athlete: { select: { id: true, name: true, nameEn: true, email: true } },
      },
    })

    await createNotification(session.athleteId, {
      type: 'BOOKING',
      titleFa: 'زمان جلسه تغییر کرد',
      titleEn: 'Session rescheduled',
      bodyFa: `${session.coach.nameFa} زمان جلسه را تغییر داد`,
      bodyEn: `${session.coach.nameEn} rescheduled your session`,
      link: '/dashboard?tab=bookings',
    })

    return updated
  }

  return prisma.coachSession.findUnique({
    where: { id },
    include: {
      coach: { include: { sport: true } },
      club: true,
      athlete: { select: { id: true, name: true, nameEn: true, email: true } },
    },
  })
})
