import type { H3Event } from 'h3'
import type { ScheduleEvent } from '~/types'
import { palette } from './palette'

export const SCHEDULE_COLORS = {
  platformBooking: palette.schedule.platformBooking,
  clubBooking: palette.schedule.clubBooking,
  openSlot: palette.schedule.openSlot,
  class: palette.schedule.class,
} as const

export function scheduleLocale(event: H3Event) {
  const fromQuery = getQuery(event).locale
  if (fromQuery === 'en' || fromQuery === 'fa') return fromQuery

  const fromCookie = getCookie(event, 'inboxs_locale')
  if (fromCookie === 'en' || fromCookie === 'fa') return fromCookie

  return getRequestHeader(event, 'accept-language')?.includes('en') ? 'en' : 'fa'
}

export function schedulePickName(obj: { nameFa?: string; nameEn?: string; titleFa?: string; titleEn?: string }, locale: string) {
  const nameFa = obj.nameFa ?? obj.titleFa ?? ''
  const nameEn = obj.nameEn ?? obj.titleEn ?? ''
  return locale === 'fa' ? nameFa : nameEn
}

export function bookingDisplayName(
  booking: { user?: { name: string } | null; guestName?: string | null },
  locale: string,
) {
  return booking.user?.name ?? booking.guestName ?? (locale === 'fa' ? 'مهمان' : 'Guest')
}

export function bookingScheduleColor(source: 'PLATFORM' | 'CLUB') {
  return source === 'CLUB' ? SCHEDULE_COLORS.clubBooking : SCHEDULE_COLORS.platformBooking
}

export function scheduleFormatFraction(numerator: number, denominator: number, locale: string) {
  const numberLocale = locale === 'fa' ? 'fa-IR' : 'en-US'
  const format = (value: number) => new Intl.NumberFormat(numberLocale).format(value)
  return `${format(numerator)}/${format(denominator)}`
}

export function sortScheduleEvents(events: ScheduleEvent[]) {
  events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.startTime.localeCompare(b.startTime)
  })
  return events
}
