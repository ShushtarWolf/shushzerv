import {
  assertCoachSlotAvailable,
  incrementCoachSessionCount,
} from '../../utils/coachSession'
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

  if (!body.coachId || !body.date || !body.startTime || !body.endTime) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const coach = await prisma.coach.findUnique({ where: { id: body.coachId } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach not found' })

  await assertCoachSlotAvailable(body.coachId, body.date, body.startTime, body.endTime)

  const payWithWallet = body.payWithWallet === true
  const sessionPrice = coach.sessionPrice

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
        slotId: body.slotId || null,
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
      await tx.coach.update({
        where: { id: coach.id },
        data: { sessions: { increment: 1 } },
      })
    }

    return created
  })

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

  return session
})
