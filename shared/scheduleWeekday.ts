import { WEEKDAY_CODES, type WeekdayCode } from './classPackage'

const JS_DAY_TO_CODE: WeekdayCode[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function weekdayCodeFromDate(dateIso: string): WeekdayCode {
  const d = new Date(`${dateIso}T12:00:00`)
  return JS_DAY_TO_CODE[d.getDay()] ?? 'MON'
}

export function eachDateInRange(from: string, to: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return []

  const dates: string[] = []
  const cur = new Date(`${from}T12:00:00`)
  const end = new Date(`${to}T12:00:00`)
  if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime()) || cur > end) return []

  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }

  return dates
}

export function datesMatchingWeekdays(fromDate: string, toDate: string, daysOfWeek: string): string[] {
  const codes = new Set(
    daysOfWeek.split(',').map((d) => d.trim().toUpperCase()).filter((d): d is WeekdayCode =>
      WEEKDAY_CODES.includes(d as WeekdayCode),
    ),
  )
  if (!codes.size) return []

  return eachDateInRange(fromDate, toDate).filter((date) => codes.has(weekdayCodeFromDate(date)))
}
