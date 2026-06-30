import type { Prisma } from '@prisma/client'
import {
  assertCoachSlotAvailable,
  incrementCoachSessionCount,
  timeRangesOverlap,
} from './coachSession'
import { createNotification } from './notifications'

type Tx = Prisma.TransactionClient

export type SlotTimes = {
  id: string
  date: string
  startTime: string
  endTime: string
}

export async function assertCoachAvailableForSlots(
  coachId: string,
  slots: SlotTimes[],
) {
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (
        slots[i].date === slots[j].date
        && timeRangesOverlap(slots[i].startTime, slots[i].endTime, slots[j].startTime, slots[j].endTime)
      ) {
        throw createError({ statusCode: 409, statusMessage: 'Selected slots overlap for the same coach' })
      }
    }
  }

  for (const slot of slots) {
    await assertCoachSlotAvailable(coachId, slot.date, slot.startTime, slot.endTime)
  }
}

export async function createClubCoachSession(
  tx: Tx,
  opts: {
    coachId: string
    athleteId: string
    clubId: string
    slot: SlotTimes
    payAtClub: boolean
  },
) {
  const coach = await tx.coach.findUnique({ where: { id: opts.coachId } })
  if (!coach) {
    throw createError({ statusCode: 404, statusMessage: 'Coach not found' })
  }

  const session = await tx.coachSession.create({
    data: {
      coachId: opts.coachId,
      athleteId: opts.athleteId,
      clubId: opts.clubId,
      slotId: opts.slot.id,
      date: opts.slot.date,
      startTime: opts.slot.startTime,
      endTime: opts.slot.endTime,
      price: coach.sessionPrice,
      status: 'CONFIRMED',
      paymentStatus: opts.payAtClub ? 'PAY_AT_CLUB' : 'PAID',
    },
    include: {
      coach: { select: { userId: true, nameFa: true, nameEn: true } },
      athlete: { select: { name: true, nameEn: true } },
    },
  })

  await incrementCoachSessionCount(opts.coachId)
  return session
}

export async function notifyCoachOfClubSession(
  session: {
    coach: { userId: string | null; nameFa: string; nameEn: string }
    athlete: { name: string; nameEn: string | null }
    date: string
    startTime: string
  },
) {
  if (!session.coach.userId) return

  const athleteName = session.athlete.name
  const athleteNameEn = session.athlete.nameEn ?? session.athlete.name

  await createNotification(session.coach.userId, {
    type: 'BOOKING',
    titleFa: 'جلسه جدید در باشگاه',
    titleEn: 'New session at club',
    bodyFa: `${athleteName} جلسه‌ای در باشگاه برای ${session.date} ${session.startTime} رزرو کرد`,
    bodyEn: `${athleteNameEn} booked a session at the club for ${session.date} ${session.startTime}`,
    link: '/dashboard/coach?tab=schedule',
  })
}
