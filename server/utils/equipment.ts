import type { EquipmentMode, Prisma } from '@prisma/client'

type Tx = Prisma.TransactionClient

export type EquipmentSelection = { id: string; quantity: number }

export type ResolvedEquipmentLine = {
  addonId?: string
  equipmentId?: string
  quantity: number
  nameFa: string
  nameEn: string
  price: number
  mode: EquipmentMode
}

export function equipmentRentalTotal(
  lines: Array<{ price: number; quantity: number; mode: EquipmentMode }>,
) {
  return lines.reduce(
    (sum, line) => (line.mode === 'RENTAL' ? sum + line.price * line.quantity : sum),
    0,
  )
}

function normalizeSelections(selections: EquipmentSelection[] | undefined) {
  const map = new Map<string, number>()
  for (const sel of selections ?? []) {
    const qty = Math.floor(Number(sel.quantity))
    if (!sel.id || qty < 1) continue
    map.set(sel.id, (map.get(sel.id) ?? 0) + qty)
  }
  return [...map.entries()].map(([id, quantity]) => ({ id, quantity }))
}

async function reservedClubAddonQty(tx: Tx, addonId: string, date: string) {
  const agg = await tx.bookingEquipment.aggregate({
    where: {
      addonId,
      booking: { status: { not: 'CANCELLED' }, slot: { date } },
    },
    _sum: { quantity: true },
  })
  return agg._sum.quantity ?? 0
}

async function reservedCoachEquipmentQty(tx: Tx, equipmentId: string, date: string) {
  const agg = await tx.coachSessionEquipment.aggregate({
    where: {
      equipmentId,
      session: { status: { not: 'CANCELLED' }, date },
    },
    _sum: { quantity: true },
  })
  return agg._sum.quantity ?? 0
}

async function clubBookableAddonIds(tx: Tx, clubId: string, courtId: string, slotDate: string) {
  const addons = await tx.courtAddon.findMany({
    where: {
      clubId,
      OR: [{ courtId: null }, { courtId }],
    },
  })
  const ids: string[] = []
  for (const addon of addons) {
    if (addon.stock != null) {
      const reserved = await reservedClubAddonQty(tx, addon.id, slotDate)
      if (reserved >= addon.stock) continue
    }
    ids.push(addon.id)
  }
  return ids
}

async function coachBookableEquipmentIds(tx: Tx, coachId: string, sessionDate: string) {
  const items = await tx.coachEquipment.findMany({ where: { coachId } })
  const ids: string[] = []
  for (const item of items) {
    if (item.stock != null) {
      const reserved = await reservedCoachEquipmentQty(tx, item.id, sessionDate)
      if (reserved >= item.stock) continue
    }
    ids.push(item.id)
  }
  return ids
}

function assertEquipmentSelected(
  bookableIds: string[],
  selections: EquipmentSelection[] | undefined,
) {
  if (!bookableIds.length) return
  const selected = normalizeSelections(selections)
  const hasSelection = selected.some((sel) => sel.quantity > 0 && bookableIds.includes(sel.id))
  if (!hasSelection) {
    throw createError({ statusCode: 400, statusMessage: 'Equipment selection is required' })
  }
}

export async function resolveClubAddonSelections(
  tx: Tx,
  clubId: string,
  courtId: string,
  slotDate: string,
  selections: EquipmentSelection[] | undefined,
): Promise<ResolvedEquipmentLine[]> {
  const bookableIds = await clubBookableAddonIds(tx, clubId, courtId, slotDate)
  assertEquipmentSelected(bookableIds, selections)

  const lines: ResolvedEquipmentLine[] = []

  for (const sel of normalizeSelections(selections)) {
    const addon = await tx.courtAddon.findFirst({ where: { id: sel.id, clubId } })
    if (!addon) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid equipment item' })
    }
    if (addon.courtId && addon.courtId !== courtId) {
      throw createError({ statusCode: 400, statusMessage: 'Equipment not available for this court' })
    }
    const max = addon.maxPerBooking ?? 4
    if (sel.quantity > max) {
      throw createError({
        statusCode: 400,
        statusMessage: `Maximum ${max} per booking for ${addon.nameEn}`,
      })
    }
    if (addon.stock != null) {
      const reserved = await reservedClubAddonQty(tx, addon.id, slotDate)
      if (reserved + sel.quantity > addon.stock) {
        throw createError({
          statusCode: 409,
          statusMessage: `Not enough stock for ${addon.nameEn}`,
        })
      }
    }

    lines.push({
      addonId: addon.id,
      quantity: sel.quantity,
      nameFa: addon.nameFa,
      nameEn: addon.nameEn,
      price: addon.mode === 'PROVIDED' ? 0 : addon.price,
      mode: addon.mode,
    })
  }

  return lines
}

export async function resolveCoachEquipmentSelections(
  tx: Tx,
  coachId: string,
  sessionDate: string,
  selections: EquipmentSelection[] | undefined,
): Promise<ResolvedEquipmentLine[]> {
  const bookableIds = await coachBookableEquipmentIds(tx, coachId, sessionDate)
  assertEquipmentSelected(bookableIds, selections)

  const lines: ResolvedEquipmentLine[] = []

  for (const sel of normalizeSelections(selections)) {
    const item = await tx.coachEquipment.findFirst({ where: { id: sel.id, coachId } })
    if (!item) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid equipment item' })
    }
    const max = item.maxPerBooking ?? 4
    if (sel.quantity > max) {
      throw createError({
        statusCode: 400,
        statusMessage: `Maximum ${max} per booking for ${item.nameEn}`,
      })
    }
    if (item.stock != null) {
      const reserved = await reservedCoachEquipmentQty(tx, item.id, sessionDate)
      if (reserved + sel.quantity > item.stock) {
        throw createError({
          statusCode: 409,
          statusMessage: `Not enough stock for ${item.nameEn}`,
        })
      }
    }

    lines.push({
      equipmentId: item.id,
      quantity: sel.quantity,
      nameFa: item.nameFa,
      nameEn: item.nameEn,
      price: item.mode === 'PROVIDED' ? 0 : item.price,
      mode: item.mode,
    })
  }

  return lines
}

export function mapLinesToBookingEquipmentCreate(lines: ResolvedEquipmentLine[]) {
  return lines.map((line) => ({
    addonId: line.addonId!,
    quantity: line.quantity,
    nameFa: line.nameFa,
    nameEn: line.nameEn,
    price: line.price,
    mode: line.mode,
  }))
}

export function mapLinesToSessionEquipmentCreate(lines: ResolvedEquipmentLine[]) {
  return lines.map((line) => ({
    equipmentId: line.equipmentId!,
    quantity: line.quantity,
    nameFa: line.nameFa,
    nameEn: line.nameEn,
    price: line.price,
    mode: line.mode,
  }))
}

export async function clubAddonAvailability(
  clubId: string,
  courtId: string,
  date: string,
) {
  const addons = await prisma.courtAddon.findMany({
    where: {
      clubId,
      OR: [{ courtId: null }, { courtId }],
    },
    orderBy: { nameFa: 'asc' },
  })

  return Promise.all(
    addons.map(async (addon) => {
      let available: number | null = null
      if (addon.stock != null) {
        const reserved = await prisma.bookingEquipment.aggregate({
          where: {
            addonId: addon.id,
            booking: { status: { not: 'CANCELLED' }, slot: { date } },
          },
          _sum: { quantity: true },
        })
        available = Math.max(0, addon.stock - (reserved._sum.quantity ?? 0))
      }
      return { ...addon, available }
    }),
  )
}

export async function coachEquipmentAvailability(coachId: string, date: string) {
  const items = await prisma.coachEquipment.findMany({
    where: { coachId },
    orderBy: { nameFa: 'asc' },
  })

  return Promise.all(
    items.map(async (item) => {
      let available: number | null = null
      if (item.stock != null) {
        const reserved = await prisma.coachSessionEquipment.aggregate({
          where: {
            equipmentId: item.id,
            session: { status: { not: 'CANCELLED' }, date },
          },
          _sum: { quantity: true },
        })
        available = Math.max(0, item.stock - (reserved._sum.quantity ?? 0))
      }
      return { ...item, available }
    }),
  )
}
