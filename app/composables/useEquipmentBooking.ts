import type { CourtAddon, CoachEquipment, EquipmentMode, ReservedEquipmentLine } from '~/types'

export type EquipmentPickerItem = Pick<
  CourtAddon | CoachEquipment,
  'id' | 'nameFa' | 'nameEn' | 'price' | 'mode' | 'maxPerBooking' | 'available'
>

export function equipmentItemMode(item: { mode?: EquipmentMode; price: number }) {
  if (item.mode) return item.mode
  return item.price > 0 ? 'RENTAL' : 'PROVIDED'
}

export function equipmentMaxQty(item: EquipmentPickerItem) {
  const perBooking = item.maxPerBooking ?? 4
  if (item.available != null) return Math.min(perBooking, item.available)
  return perBooking
}

export function equipmentSelectionsPayload(selections: Record<string, number>) {
  return Object.entries(selections)
    .filter(([, qty]) => qty > 0)
    .map(([id, quantity]) => ({ id, quantity }))
}

export function equipmentRentalSubtotal(
  items: EquipmentPickerItem[],
  selections: Record<string, number>,
) {
  return items.reduce((sum, item) => {
    const qty = selections[item.id] ?? 0
    if (!qty || equipmentItemMode(item) !== 'RENTAL') return sum
    return sum + item.price * qty
  }, 0)
}

export function summarizeReservedEquipment(lines: ReservedEquipmentLine[] | undefined) {
  return (lines ?? []).map((line) => ({
    label: line.nameFa,
    detail:
      line.mode === 'PROVIDED' || line.price <= 0
        ? 'provided'
        : `${line.quantity} × ${line.price}`,
  }))
}
