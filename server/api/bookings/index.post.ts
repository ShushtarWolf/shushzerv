export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ slotId?: string; payWithWallet?: boolean }>(event)
  const slotId = body.slotId
  if (!slotId) throw createError({ statusCode: 400, statusMessage: 'slotId is required' })

  const payWithWallet = body.payWithWallet === true

  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { court: true },
  })
  if (!slot || slot.status !== 'AVAILABLE') {
    throw createError({ statusCode: 409, statusMessage: 'Slot is no longer available' })
  }

  if (payWithWallet) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
    if (!wallet || wallet.balance < slot.price) {
      throw createError({ statusCode: 402, statusMessage: 'Insufficient wallet balance' })
    }
  }

  const booking = await prisma.$transaction(async (tx) => {
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
        status: 'CONFIRMED',
        paymentStatus: payWithWallet ? 'PAID' : 'PAY_AT_CLUB',
      },
      include: { slot: { include: { court: { include: { club: true, sport: true } } } } },
    })

    if (payWithWallet) {
      await payBookingFromWalletTx(tx, user.id, created.id, slot.price, slot.court.clubId)
    }

    return created
  })

  await awardXp(user.id, 'booking')

  return booking
})
