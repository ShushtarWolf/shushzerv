import {
  assertCoachSlotAvailable,
  incrementCoachSessionCount,
} from '../../utils/coachSession'
import {
  assertCoachSessionSlotFree,
  claimSlotForCoachSession,
  loadAvailableSlot,
} from '../../utils/coachClubBooking'
import {
  equipmentRentalTotal,
  mapLinesToSessionEquipmentCreate,
  resolveCoachEquipmentSelections,
  type EquipmentSelection,
} from '../../utils/equipment'
import { createNotification } from '../../utils/notifications'
import { sessionDisplayName } from '../../utils/session'
import { payCoachSessionFromWalletTx } from '../../utils/wallet'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'ATHLETE')
  const body = await readBody<{
    coachId?: string
    clubId?: string
    slotId?: string
    date?: string
    startTime?: string
    endTime?: string
    payWithWallet?: boolean
    equipment?: EquipmentSelection[]
  }>(event)

  if (!body.coachId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const coach = await prisma.coach.findUnique({ where: { id: body.coachId } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach not found' })

  const payWithWallet = body.payWithWallet === true
  const sessionPrice = coach.sessionPrice

  if (body.slotId) {
    const slot = await loadAvailableSlot(body.slotId, body.clubId)
    await assertCoachSessionSlotFree(body.coachId, slot)

    const session = await prisma.$transaction(async (tx) => {
      const equipmentLines = await resolveCoachEquipmentSelections(
        tx,
        body.coachId!,
        slot.date,
        body.equipment,
      )
      const equipmentTotal = equipmentRentalTotal(equipmentLines)
      const totalPrice = slot.price + sessionPrice + equipmentTotal

      if (payWithWallet) {
        if (!coach.userId) {
          throw createError({ statusCode: 400, statusMessage: 'Coach cannot accept wallet payments' })
        }
        const wallet = await tx.wallet.findUnique({ where: { userId: user.id } })
        if (!wallet || wallet.balance < totalPrice) {
          throw createError({ statusCode: 402, statusMessage: 'Insufficient wallet balance' })
        }
      }

      const { session: created } = await claimSlotForCoachSession(tx, {
        slotId: body.slotId!,
        athleteId: user.id,
        coachId: body.coachId!,
        payWithWallet,
        sessionPrice,
        equipmentTotal,
        coachUserId: coach.userId,
        bookingSource: 'PLATFORM',
      })

      if (equipmentLines.length) {
        await tx.coachSession.update({
          where: { id: created.id },
          data: {
            equipment: { create: mapLinesToSessionEquipmentCreate(equipmentLines) },
          },
        })
      }

      return tx.coachSession.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          coach: true,
          club: true,
          athlete: { select: { id: true, name: true, nameEn: true } },
          equipment: true,
          slot: { include: { court: { include: { club: true, sport: true } } } },
        },
      })
    })

    await notifyCoachSessionBooked(user, coach, session, payWithWallet)
    return session
  }

  if (!body.date || !body.startTime || !body.endTime) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  await assertCoachSlotAvailable(body.coachId, body.date, body.startTime, body.endTime)

  const session = await prisma.$transaction(async (tx) => {
    const equipmentLines = await resolveCoachEquipmentSelections(
      tx,
      body.coachId!,
      body.date!,
      body.equipment,
    )
    const equipmentTotal = equipmentRentalTotal(equipmentLines)
    const totalPrice = sessionPrice + equipmentTotal

    if (payWithWallet) {
      if (!coach.userId) {
        throw createError({ statusCode: 400, statusMessage: 'Coach cannot accept wallet payments' })
      }
      const wallet = await tx.wallet.findUnique({ where: { userId: user.id } })
      if (!wallet || wallet.balance < totalPrice) {
        throw createError({ statusCode: 402, statusMessage: 'Insufficient wallet balance' })
      }
    }

    const created = await tx.coachSession.create({
      data: {
        coachId: body.coachId!,
        athleteId: user.id,
        clubId: body.clubId || null,
        date: body.date!,
        startTime: body.startTime!,
        endTime: body.endTime!,
        price: sessionPrice,
        equipmentTotal,
        status: payWithWallet ? 'CONFIRMED' : 'PENDING',
        paymentStatus: payWithWallet ? 'PAID' : 'PAY_AT_CLUB',
        equipment: equipmentLines.length
          ? { create: mapLinesToSessionEquipmentCreate(equipmentLines) }
          : undefined,
      },
      include: { coach: true, club: true, athlete: { select: { id: true, name: true, nameEn: true } }, equipment: true },
    })

    if (payWithWallet && coach.userId) {
      await payCoachSessionFromWalletTx(tx, user.id, coach.userId, created.id, totalPrice)
      await incrementCoachSessionCount(body.coachId!)
    }

    return created
  })

  await notifyCoachSessionBooked(user, coach, session, payWithWallet)
  return session
})

async function notifyCoachSessionBooked(
  user: { id: string; name: string; nameEn?: string | null },
  coach: { userId: string | null; nameFa: string; nameEn: string },
  session: { id: string },
  payWithWallet: boolean,
) {
  const athleteName = sessionDisplayName(user, 'fa')
  const athleteNameEn = sessionDisplayName(user, 'en')

  if (coach.userId) {
    await createNotification(coach.userId, {
      type: 'BOOKING',
      titleFa: payWithWallet ? 'جلسه جدید تأیید شد' : 'درخواست جلسه جدید',
      titleEn: payWithWallet ? 'New session confirmed' : 'New session request',
      bodyFa: `${athleteName} جلسه‌ای رزرو کرد`,
      bodyEn: `${athleteNameEn} booked a session`,
      link: '/dashboard/coach?tab=schedule',
    })
  }

  await createNotification(user.id, {
    type: 'BOOKING',
    titleFa: payWithWallet ? 'جلسه مربی تأیید شد' : 'درخواست جلسه ارسال شد',
    titleEn: payWithWallet ? 'Coach session confirmed' : 'Session request sent',
    bodyFa: payWithWallet
      ? `جلسه با ${coach.nameFa} تأیید و پرداخت شد`
      : `درخواست جلسه با ${coach.nameFa} در انتظار تأیید مربی است`,
    bodyEn: payWithWallet
      ? `Session with ${coach.nameEn} confirmed and paid`
      : `Session request with ${coach.nameEn} is pending coach confirmation`,
    link: '/dashboard?tab=bookings',
  })
}
