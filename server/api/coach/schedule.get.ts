import type { ScheduleEvent } from '~/types'
import { scheduleFormatFraction, scheduleLocale, schedulePickName, SCHEDULE_COLORS } from '../../utils/schedule'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const { from, to } = getQuery(event)
  const locale = scheduleLocale(event)

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) {
    return { events: [] as ScheduleEvent[] }
  }

  const fromDate = typeof from === 'string' ? from : undefined
  const toDate = typeof to === 'string' ? to : undefined
  const dateFilter = fromDate && toDate ? { gte: fromDate, lte: toDate } : undefined

  const [classes, sessions] = await Promise.all([
    prisma.classSession.findMany({
      where: {
        coachId: coach.id,
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: { sport: true, club: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.coachSession.findMany({
      where: {
        coachId: coach.id,
        status: { not: 'CANCELLED' },
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: { club: true, athlete: { select: { name: true } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    }),
  ])

  const events: ScheduleEvent[] = []

  for (const c of classes) {
    events.push({
      id: `class-${c.id}`,
      type: 'class',
      date: c.date,
      startTime: c.startTime,
      endTime: c.endTime,
      title: schedulePickName(c, locale),
      subtitle: c.club
        ? `${schedulePickName(c.club, locale)} · ${scheduleFormatFraction(c.bookedSeats, c.maxSeats, locale)}`
        : scheduleFormatFraction(c.bookedSeats, c.maxSeats, locale),
      color: SCHEDULE_COLORS.class,
      status: c.status,
      classId: c.id,
      note: c.coachNote,
    })
  }

  for (const s of sessions) {
    events.push({
      id: `session-${s.id}`,
      type: 'session',
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      title: s.athlete?.name ?? (locale === 'fa' ? 'جلسه خصوصی' : 'Private session'),
      subtitle: s.club ? schedulePickName(s.club, locale) : undefined,
      color: SCHEDULE_COLORS.clubBooking,
      status: s.status,
      price: s.price,
      sessionId: s.id,
      note: s.coachNote,
    })
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  return { events }
})
