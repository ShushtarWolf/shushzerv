import type { ScheduleEvent } from '~/types'
import { bookingDisplayName, bookingScheduleColor, scheduleLocale, schedulePickName, SCHEDULE_COLORS, sortScheduleEvents } from '../utils/schedule'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { from, to } = getQuery(event)
  const locale = scheduleLocale(event)

  const fromDate = typeof from === 'string' ? from : undefined
  const toDate = typeof to === 'string' ? to : undefined
  const dateFilter = fromDate && toDate ? { gte: fromDate, lte: toDate } : undefined

  const [bookings, enrollments, matchParticipants, coachSessions, tournamentRegs] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: user.id,
        status: { not: 'CANCELLED' },
        ...(dateFilter ? { slot: { date: dateFilter } } : {}),
      },
      include: {
        slot: { include: { court: { include: { club: true, sport: true } } } },
      },
    }),
    prisma.classEnrollment.findMany({
      where: {
        userId: user.id,
        ...(dateFilter ? { classSession: { date: dateFilter } } : {}),
      },
      include: {
        classSession: { include: { sport: true, club: true, coach: true } },
      },
    }),
    prisma.matchParticipant.findMany({
      where: {
        userId: user.id,
        match: {
          status: { not: 'CANCELLED' },
          ...(dateFilter ? { date: dateFilter } : {}),
        },
      },
      include: {
        match: { include: { sport: true, club: true } },
      },
    }),
    prisma.coachSession.findMany({
      where: {
        athleteId: user.id,
        status: { not: 'CANCELLED' },
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: { coach: true, club: true },
    }),
    prisma.tournamentRegistration.findMany({
      where: {
        userId: user.id,
        tournament: {
          status: { not: 'CANCELLED' },
          ...(dateFilter ? { date: dateFilter } : {}),
        },
      },
      include: {
        tournament: { include: { sport: true, club: true } },
      },
    }),
  ])

  const events: ScheduleEvent[] = []

  for (const b of bookings) {
    if (!b.slot) continue
    const court = b.slot.court
    const club = court?.club
    events.push({
      id: `booking-${b.id}`,
      type: 'booking',
      date: b.slot.date,
      startTime: b.slot.startTime,
      endTime: b.slot.endTime,
      title: club ? schedulePickName(club, locale) : schedulePickName({ nameFa: 'باشگاه', nameEn: 'Club' }, locale),
      subtitle: court ? schedulePickName(court, locale) : undefined,
      color: bookingScheduleColor(b.source),
      status: b.status,
      paymentStatus: b.paymentStatus,
      price: b.slot.price,
      bookingSource: b.source,
    })
  }

  for (const e of enrollments) {
    const c = e.classSession
    if (!c) continue
    events.push({
      id: `class-${c.id}`,
      type: 'class',
      date: c.date,
      startTime: c.startTime,
      endTime: c.endTime,
      title: schedulePickName(c, locale),
      subtitle: c.club
        ? `${schedulePickName(c.club, locale)}${c.coach ? ` · ${schedulePickName(c.coach, locale)}` : ''}`
        : c.coach
          ? schedulePickName(c.coach, locale)
          : undefined,
      color: SCHEDULE_COLORS.class,
      status: c.status,
      classId: c.id,
      price: c.price,
    })
  }

  for (const p of matchParticipants) {
    const m = p.match
    if (!m) continue
    events.push({
      id: `match-${m.id}`,
      type: 'match',
      date: m.date,
      startTime: m.startTime,
      endTime: m.endTime ?? m.startTime,
      title: m.sport ? schedulePickName(m.sport, locale) : (locale === 'fa' ? 'همبازی' : 'Match'),
      subtitle: m.club ? schedulePickName(m.club, locale) : m.city,
      color: SCHEDULE_COLORS.match,
      status: m.status,
      matchId: m.id,
    })
  }

  for (const s of coachSessions) {
    events.push({
      id: `session-${s.id}`,
      type: 'session',
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      title: s.coach ? schedulePickName(s.coach, locale) : (locale === 'fa' ? 'جلسه مربی' : 'Coach session'),
      subtitle: s.club ? schedulePickName(s.club, locale) : undefined,
      color: SCHEDULE_COLORS.clubBooking,
      status: s.status,
      coachId: s.coachId,
      price: s.price,
    })
  }

  for (const r of tournamentRegs) {
    const tr = r.tournament
    if (!tr) continue
    events.push({
      id: `tournament-${tr.id}`,
      type: 'tournament',
      date: tr.date,
      startTime: tr.startTime,
      endTime: tr.startTime,
      title: schedulePickName(tr, locale),
      subtitle: tr.club ? schedulePickName(tr.club, locale) : (tr.sport ? schedulePickName(tr.sport, locale) : undefined),
      color: SCHEDULE_COLORS.tournament,
      status: tr.status,
      tournamentId: tr.id,
      price: tr.price,
    })
  }

  return { events: sortScheduleEvents(events) }
})
