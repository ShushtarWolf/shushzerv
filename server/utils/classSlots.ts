import type { Prisma } from '@prisma/client'
import { generateSlotsForCourtDate, resolveSlotGenerationParams } from './clubSlots'
import { slotsOverlap } from './slotSchedule'

type Tx = Prisma.TransactionClient

export async function blockSlotsForClassSession(
  options: {
    clubId: string
    sportId: string
    date: string
    startTime: string
    endTime: string
    courtIds?: string[]
  },
  tx: Tx | typeof prisma = prisma,
) {
  const { clubId, sportId, date, startTime, endTime, courtIds } = options

  const club = await tx.club.findUnique({ where: { id: clubId } })
  if (!club) return

  let courts = await tx.court.findMany({
    where: {
      clubId,
      sportId,
      ...(courtIds?.length ? { id: { in: courtIds } } : {}),
    },
  })

  if (!courts.length && !courtIds?.length) {
    const sportCourts = await tx.court.findMany({ where: { clubId, sportId } })
    if (sportCourts.length === 1) courts = sportCourts
  }

  if (!courts.length) return

  const { durationMinutes, openTime, closeTime, price } = resolveSlotGenerationParams(club, {})

  for (const court of courts) {
    await generateSlotsForCourtDate({
      courtId: court.id,
      date,
      durationMinutes,
      openTime,
      closeTime,
      price,
    })

    const slots = await tx.slot.findMany({
      where: { courtId: court.id, date },
    })

    for (const slot of slots) {
      if (!slotsOverlap(slot.startTime, slot.endTime, startTime, endTime)) continue

      if (slot.status === 'BOOKED') {
        throw createError({ statusCode: 409, statusMessage: 'Court already booked during class time' })
      }
      if (slot.status === 'AVAILABLE') {
        await tx.slot.update({
          where: { id: slot.id },
          data: { status: 'BLOCKED' },
        })
      }
    }
  }
}
