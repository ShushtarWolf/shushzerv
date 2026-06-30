import type { Prisma } from '@prisma/client'
import { assertCoachSlotAvailable } from './coachSession'
import { payBookingFromWalletTx, payCoachSessionFromWalletTx } from './wallet'

type Tx = Prisma.TransactionClient

export async function loadAvailableSlot(slotId: string, clubId?: string) {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { court: { include: { club: true, sport: true } }, booking: true, coachSession: true },
  })
  if (!slot || slot.status !== 'AVAILABLE' || slot.booking || slot.coachSession) {
    throw createError({ statusCode: 409, statusMessage: 'Slot is no longer available' })
  }
  if (clubId && slot.court.clubId !== clubId) {
    throw createError({ statusCode: 400, statusMessage: 'Slot does not belong to this club' })
  }
  return slot
}

export async function claimSlotForCoachSession(
  tx: Tx,
  opts: {
    slotId: string
    athleteId: string
    coachId: string
    payWithWallet: boolean
    sessionPrice: number
    equipmentTotal: number
    coachUserId: string | null
    bookingSource: 'PLATFORM' | 'CLUB'
  },
) {
  const claimed = await tx.slot.updateMany({
    where: { id: opts.slotId, status: 'AVAILABLE' },
    data: { status: 'BOOKED' },
  })
  if (claimed.count === 0) {
    throw createError({ statusCode: 409, statusMessage: 'Slot is no longer available' })
  }

  const slot = await tx.slot.findUniqueOrThrow({
    where: { id: opts.slotId },
    include: { court: { include: { club: true } } },
  })

  const booking = await tx.booking.create({
    data: {
      slotId: opts.slotId,
      userId: opts.athleteId,
      source: opts.bookingSource,
      status: 'CONFIRMED',
      paymentStatus: opts.payWithWallet ? 'PAID' : 'PAY_AT_CLUB',
    },
  })

  const session = await tx.coachSession.create({
    data: {
      coachId: opts.coachId,
      athleteId: opts.athleteId,
      clubId: slot.court.clubId,
      slotId: opts.slotId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      price: opts.sessionPrice,
      equipmentTotal: opts.equipmentTotal,
      status: 'CONFIRMED',
      paymentStatus: opts.payWithWallet ? 'PAID' : 'PAY_AT_CLUB',
    },
    include: {
      coach: true,
      club: true,
      athlete: { select: { id: true, name: true, nameEn: true } },
      slot: { include: { court: { include: { club: true, sport: true } } } },
    },
  })

  if (opts.payWithWallet && opts.coachUserId) {
    const courtTotal = slot.price
    const coachTotal = opts.sessionPrice + opts.equipmentTotal
    await payBookingFromWalletTx(tx, opts.athleteId, booking.id, courtTotal, slot.court.clubId)
    await payCoachSessionFromWalletTx(tx, opts.athleteId, opts.coachUserId, session.id, coachTotal)
  }

  await tx.coach.update({
    where: { id: opts.coachId },
    data: { sessions: { increment: 1 } },
  })

  return { booking, session, slot }
}

export async function assertCoachSessionSlotFree(
  coachId: string,
  slot: { date: string; startTime: string; endTime: string },
) {
  await assertCoachSlotAvailable(coachId, slot.date, slot.startTime, slot.endTime)
}
