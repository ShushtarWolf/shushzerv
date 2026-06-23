export const CHART_FIELDS = {
  ATHLETE: ['labels', 'spending', 'bookingTrend', 'classTrend', 'matchTrend', 'breakdown'],
  COACH: ['labels', 'earnings', 'sessionTrend', 'breakdown'],
  CLUB_ADMIN: ['labels', 'revenue', 'bookingTrend', 'classTrend', 'dowLabels', 'bookingByDow', 'classByDow', 'breakdown'],
  PLATFORM_ADMIN: ['labels', 'users', 'clubs', 'bookings', 'fees'],
} as const

export type ChartRole = keyof typeof CHART_FIELDS

export function hasChartFields(role: ChartRole, body: Record<string, unknown> | null | undefined) {
  const keys = CHART_FIELDS[role]
  if (!body) return { ok: false, detail: 'empty body' }
  const missing = keys.filter((k) => body[k] === undefined)
  if (missing.length) return { ok: false, detail: `missing: ${missing.join(', ')}` }
  return { ok: true as const }
}
