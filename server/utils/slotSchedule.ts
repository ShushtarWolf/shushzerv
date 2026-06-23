export const SLOT_DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240] as const

export type SlotDurationMinutes = (typeof SLOT_DURATION_OPTIONS)[number]

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function normalizeSlotDuration(minutes: unknown): SlotDurationMinutes {
  const value = Number(minutes)
  if (SLOT_DURATION_OPTIONS.includes(value as SlotDurationMinutes)) {
    return value as SlotDurationMinutes
  }
  return 120
}

export function normalizeTimeValue(time: unknown, fallback: string): string {
  if (typeof time !== 'string') return fallback
  return /^\d{2}:\d{2}$/.test(time) ? time : fallback
}

export function buildSlotTimes(
  durationMinutes: number,
  openTime = '08:00',
  closeTime = '22:00',
): Array<{ startTime: string; endTime: string }> {
  const duration = normalizeSlotDuration(durationMinutes)
  const open = parseTimeToMinutes(normalizeTimeValue(openTime, '08:00'))
  const close = parseTimeToMinutes(normalizeTimeValue(closeTime, '22:00'))

  if (close <= open) return []

  const slots: Array<{ startTime: string; endTime: string }> = []
  let start = open

  while (start + duration <= close) {
    const end = start + duration
    slots.push({
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
    })
    start = end
  }

  return slots
}

export function slotsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const as = parseTimeToMinutes(aStart)
  const ae = parseTimeToMinutes(aEnd)
  const bs = parseTimeToMinutes(bStart)
  const be = parseTimeToMinutes(bEnd)
  return as < be && bs < ae
}

export function slotDurationMinutes(startTime: string, endTime: string): number {
  return Math.max(0, parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime))
}
