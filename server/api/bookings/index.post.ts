import {
  equipmentRentalTotal,
  mapLinesToBookingEquipmentCreate,
  resolveClubAddonSelections,
  type EquipmentSelection,
} from '../../utils/equipment'
import { FIND_PLAYERS_ENABLED } from '#shared/features'
import { payBookingFromWalletTx } from '../../utils/wallet'
import { awardXp } from '../../utils/gamification'
import { createNotification } from '../../utils/notifications'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{
    slotId?: string
    payWithWallet?: boolean
    playerCount?: number
    createMatch?: boolean
    equipment?: EquipmentSelection[]
  }>(event)
  const slotId = body.slotId
  if (!slotId) throw createError({ statusCode: 400, statusMessage: 'slotId is required' })

  const payWithWallet = body.payWithWallet === true

  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { court: { include: { club: true, sport: true } } },
  })
  if (!slot || slot.status !== 'AVAILABLE') {
    throw createError({ statusCode: 409, statusMessage: 'Slot is no longer available' })
  }

  const booking = await prisma.$transaction(async (tx) => {
    const equipmentLines = await resolveClubAddonSelections(
      tx,
      slot.court.clubId,
      slot.courtId,
      slot.date,
      body.equipment,
    )
    const equipmentTotal = equipmentRentalTotal(equipmentLines)
    const totalPrice = slot.price + equipmentTotal

    if (payWithWallet) {
      const wallet = await tx.wallet.findUnique({ where: { userId: user.id } })
      if (!wallet || wallet.balance < totalPrice) {
        throw createError({ statusCode: 402, statusMessage: 'Insufficient wallet balance' })
      }
    }

    const claimed = await tx.slot.updateMany({
      where: { id: slotId, status: 'AVAILABLE' },
      data: { status: 'BOOKED' },
    })
    if (claimed.count === 0) {
      throw createError({ statusCode: 409, statusMessage: 'Slot is no longer available' })
    }

    const created = await tx.booking.create({
      data: {
        userId: user.id,
        slotId,
        source: 'PLATFORM',
        status: 'CONFIRMED',
        paymentStatus: payWithWallet ? 'PAID' : 'PAY_AT_CLUB',
        playerCount: body.playerCount && body.playerCount >= 1 ? body.playerCount : 2,
        equipmentTotal,
        equipment: equipmentLines.length
          ? { create: mapLinesToBookingEquipmentCreate(equipmentLines) }
          : undefined,
      },
      include: {
        slot: { include: { court: { include: { club: true, sport: true } } } },
        equipment: true,
      },
    })

    if (payWithWallet) {
      await payBookingFromWalletTx(tx, user.id, created.id, totalPrice, slot.court.clubId)
    }

    return created
  })

  await awardXp(user.id, 'booking')

  let match = null
  if (FIND_PLAYERS_ENABLED && body.createMatch && booking.slot?.court?.sport) {
    const shareToken = crypto.randomUUID().slice(0, 8)
    match = await prisma.openMatch.create({
      data: {
        city: booking.slot.court.club?.city ?? 'tehran',
        date: booking.slot.date,
        startTime: booking.slot.startTime,
        maxPlayers: body.playerCount && body.playerCount >= 2 ? body.playerCount : 4,
        sportId: booking.slot.court.sportId,
        clubId: booking.slot.court.clubId,
        creatorId: user.id,
        shareToken,
        participants: { create: { userId: user.id } },
      },
    })
    await createNotification(user.id, {
      type: 'MATCH',
      titleFa: 'بازی عمومی ساخته شد',
      titleEn: 'Public match created',
      link: `/matches/${match.id}`,
    })
  }

  return { booking, match }
})
