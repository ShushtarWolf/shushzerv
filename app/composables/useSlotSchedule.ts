export const SLOT_DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240] as const

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function buildSlotTimes(
  durationMinutes: number,
  openTime = '08:00',
  closeTime = '22:00',
) {
  const open = parseTimeToMinutes(openTime)
  const close = parseTimeToMinutes(closeTime)
  if (close <= open) return [] as Array<{ startTime: string; endTime: string }>

  const slots: Array<{ startTime: string; endTime: string }> = []
  let start = open
  while (start + durationMinutes <= close) {
    const end = start + durationMinutes
    slots.push({ startTime: minutesToTime(start), endTime: minutesToTime(end) })
    start = end
  }
  return slots
}

export function slotDurationMinutes(startTime: string, endTime: string): number {
  return Math.max(0, parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime))
}

export function useSlotSchedule() {
  const { locale } = useI18n()
  const { formatNumber, formatDecimal, formatTime, formatTimeRange } = useLocaleContent()

  function durationLabel(minutes: number): string {
    if (minutes < 60) {
      return locale.value === 'fa'
        ? `${formatNumber(minutes)} دقیقه`
        : `${minutes} min`
    }
    if (minutes % 60 === 0) {
      const hours = minutes / 60
      return locale.value === 'fa'
        ? `${formatNumber(hours)} ساعت`
        : `${hours}h`
    }
    const hours = minutes / 60
    return locale.value === 'fa'
      ? `${formatDecimal(hours, 1)} ساعت`
      : `${formatDecimal(hours, 1)}h`
  }

  function eventDurationLabel(startTime: string, endTime: string) {
    return durationLabel(slotDurationMinutes(startTime, endTime))
  }

  return {
    SLOT_DURATION_OPTIONS,
    buildSlotTimes,
    durationLabel,
    eventDurationLabel,
    formatTime,
    formatTimeRange,
  }
}
