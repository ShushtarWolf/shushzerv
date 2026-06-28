export const WEEKDAY_CODES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
export type WeekdayCode = (typeof WEEKDAY_CODES)[number]

export function parseDaysOfWeek(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return 'SAT'
  const parts = raw.split(',').map((d) => d.trim().toUpperCase()).filter(Boolean)
  const valid = parts.filter((d): d is WeekdayCode => WEEKDAY_CODES.includes(d as WeekdayCode))
  return valid.length ? valid.join(',') : 'SAT'
}

export function toggleDayOfWeek(current: string, code: WeekdayCode): string {
  const set = new Set(current.split(',').map((d) => d.trim()).filter(Boolean))
  if (set.has(code)) set.delete(code)
  else set.add(code)
  const ordered = WEEKDAY_CODES.filter((c) => set.has(c))
  return ordered.length ? ordered.join(',') : code
}

export function isDaySelected(current: string, code: WeekdayCode): boolean {
  return current.split(',').map((d) => d.trim()).includes(code)
}
