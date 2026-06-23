import {
  buildSlotTimes,
  normalizeSlotDuration,
  normalizeTimeValue,
  slotsOverlap,
} from './slotSchedule'

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

export async function generateSlotsForCourtDate(options: {
  courtId: string
  date: string
  durationMinutes: number
  openTime: string
  closeTime: string
  price: number
}) {
  const { courtId, date, durationMinutes, openTime, closeTime, price } = options

  const existing = await prisma.slot.findMany({
    where: { courtId, date },
    select: { startTime: true, endTime: true },
  })

  const toCreate = buildSlotTimes(durationMinutes, openTime, closeTime)
    .filter((slot) => !existing.some((ex) => slotsOverlap(slot.startTime, slot.endTime, ex.startTime, ex.endTime)))
    .map((slot) => ({
      courtId,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      price,
      status: 'AVAILABLE' as const,
    }))

  if (toCreate.length) {
    await prisma.slot.createMany({ data: toCreate })
  }

  return toCreate.length
}

export function resolveSlotGenerationParams(
  club: { slotDurationMinutes: number; slotOpenTime: string; slotCloseTime: string; priceFrom: number },
  body: { durationMinutes?: number; price?: number },
) {
  const durationMinutes = normalizeSlotDuration(body.durationMinutes ?? club.slotDurationMinutes)
  const openTime = normalizeTimeValue(club.slotOpenTime, '08:00')
  const closeTime = normalizeTimeValue(club.slotCloseTime, '22:00')
  const price = body.price && body.price > 0 ? body.price : club.priceFrom

  return { durationMinutes, openTime, closeTime, price }
}
