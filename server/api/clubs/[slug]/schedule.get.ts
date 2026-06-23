import type { ScheduleEvent } from '~/types'
import { scheduleLocale, schedulePickName, scheduleFormatFraction, SCHEDULE_COLORS, sortScheduleEvents } from '../../../utils/schedule'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const { from, to, courtId } = getQuery(event)
  const locale = scheduleLocale(event)

  const club = await prisma.club.findUnique({ where: { slug } })
  if (!club) {
    throw createError({ statusCode: 404, statusMessage: 'Club not found' })
  }

  const fromDate = typeof from === 'string' ? from : undefined
  const toDate = typeof to === 'string' ? to : undefined
  const dateFilter = fromDate && toDate ? { gte: fromDate, lte: toDate } : undefined
  const courtIdFilter = courtId && typeof courtId === 'string' ? { courtId: String(courtId) } : {}

  const [classes, slots] = await Promise.all([
    prisma.classSession.findMany({
      where: {
        clubId: club.id,
        status: { not: 'CANCELLED' },
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: { sport: true, coach: true },
    }),
    prisma.slot.findMany({
      where: {
        status: 'AVAILABLE',
        ...courtIdFilter,
        ...(dateFilter ? { date: dateFilter } : {}),
        court: { clubId: club.id },
      },
      include: { court: { include: { sport: true } } },
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
      subtitle: c.coach
        ? `${schedulePickName(c.coach, locale)} · ${scheduleFormatFraction(c.bookedSeats, c.maxSeats, locale)}`
        : scheduleFormatFraction(c.bookedSeats, c.maxSeats, locale),
      color: SCHEDULE_COLORS.class,
      status: c.status,
      classId: c.id,
      price: c.price,
    })
  }

  for (const s of slots) {
    events.push({
      id: `slot-${s.id}`,
      type: 'slot',
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      title: s.court ? schedulePickName(s.court, locale) : 'Court',
      subtitle: locale === 'fa' ? 'سانس آزاد' : 'Open slot',
      color: SCHEDULE_COLORS.openSlot,
      status: s.status,
      slotId: s.id,
      price: s.price,
    })
  }

  return { events: sortScheduleEvents(events) }
})
