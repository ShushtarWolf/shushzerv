import { palette } from '../../utils/palette'
import type { ScheduleEvent } from '~/types'
import { bookingDisplayName, bookingScheduleColor, scheduleLocale, schedulePickName, scheduleFormatFraction, SCHEDULE_COLORS, sortScheduleEvents } from '../../utils/schedule'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const { clubId, from, to } = getQuery(event)
  const locale = scheduleLocale(event)

  if (!clubId || typeof clubId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'clubId required' })
  }

  const club = await prisma.club.findFirst({
    where: { id: clubId, ownerId: user.id },
  })
  if (!club) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const fromDate = typeof from === 'string' ? from : undefined
  const toDate = typeof to === 'string' ? to : undefined
  const dateFilter = fromDate && toDate ? { gte: fromDate, lte: toDate } : undefined

  const [bookings, classes, slots] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { not: 'CANCELLED' },
        slot: {
          ...(dateFilter ? { date: dateFilter } : {}),
          court: { clubId },
        },
      },
      include: {
        user: { select: { name: true } },
        slot: { include: { court: { include: { sport: true } } } },
      },
    }),
    prisma.classSession.findMany({
      where: {
        clubId,
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: { sport: true, coach: true },
    }),
    prisma.slot.findMany({
      where: {
        ...(dateFilter ? { date: dateFilter } : {}),
        court: { clubId },
      },
      include: {
        court: { include: { sport: true } },
        booking: { select: { id: true, status: true } },
      },
    }),
  ])

  const bookedSlotIds = new Set(bookings.map((b) => b.slotId))
  const events: ScheduleEvent[] = []

  for (const b of bookings) {
    if (!b.slot) continue
    const court = b.slot.court
    events.push({
      id: `booking-${b.id}`,
      type: 'booking',
      date: b.slot.date,
      startTime: b.slot.startTime,
      endTime: b.slot.endTime,
      title: bookingDisplayName(b, locale),
      subtitle: court ? schedulePickName(court, locale) : undefined,
      color: bookingScheduleColor(b.source),
      status: b.status,
      paymentStatus: b.paymentStatus,
      bookingSource: b.source,
      bookingId: b.id,
      slotId: b.slotId,
      note: b.ownerNote,
    })
  }

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
      note: c.clubNote,
    })
  }

  for (const s of slots) {
    if (bookedSlotIds.has(s.id)) continue
    if (s.status !== 'AVAILABLE' && s.status !== 'BLOCKED') continue
    events.push({
      id: `slot-${s.id}`,
      type: 'slot',
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      title: s.court ? schedulePickName(s.court, locale) : 'Court',
      subtitle: s.status === 'BLOCKED'
        ? (locale === 'fa' ? 'مسدود' : 'Blocked')
        : (locale === 'fa' ? 'سانس آزاد' : 'Open slot'),
      color: s.status === 'BLOCKED' ? palette.schedule.blocked : SCHEDULE_COLORS.openSlot,
      status: s.status,
      slotId: s.id,
      price: s.price,
      note: s.ownerNote,
    })
  }

  return { events: sortScheduleEvents(events) }
})
