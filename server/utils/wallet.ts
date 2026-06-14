import type { Prisma, WalletTxType } from '@prisma/client'

export const PLATFORM_FEE_PERCENT = 10
export const COACH_SHARE_PERCENT = 15

type TxClient = Prisma.TransactionClient | typeof prisma

async function ensureUserWallet(tx: TxClient, userId: string) {
  return tx.wallet.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {},
  })
}

async function ensureClubWallet(tx: TxClient, clubId: string) {
  return tx.clubWallet.upsert({
    where: { clubId },
    create: { clubId, balance: 0 },
    update: {},
  })
}

async function creditUserWallet(
  tx: TxClient,
  userId: string,
  amount: number,
  type: WalletTxType,
  note: { noteFa: string; noteEn: string },
  referenceId?: string,
) {
  const wallet = await ensureUserWallet(tx, userId)
  const balanceAfter = wallet.balance + amount
  await tx.wallet.update({ where: { userId }, data: { balance: balanceAfter } })
  await tx.walletTransaction.create({
    data: {
      type,
      amount,
      balanceAfter,
      userId,
      referenceId,
      noteFa: note.noteFa,
      noteEn: note.noteEn,
    },
  })
  return balanceAfter
}

async function debitUserWallet(
  tx: TxClient,
  userId: string,
  amount: number,
  type: WalletTxType,
  note: { noteFa: string; noteEn: string },
  referenceId?: string,
) {
  const wallet = await ensureUserWallet(tx, userId)
  if (wallet.balance < amount) {
    throw createError({ statusCode: 402, statusMessage: 'Insufficient wallet balance' })
  }
  const balanceAfter = wallet.balance - amount
  await tx.wallet.update({ where: { userId }, data: { balance: balanceAfter } })
  await tx.walletTransaction.create({
    data: {
      type,
      amount: -amount,
      balanceAfter,
      userId,
      referenceId,
      noteFa: note.noteFa,
      noteEn: note.noteEn,
    },
  })
  return balanceAfter
}

async function creditClubWallet(
  tx: TxClient,
  clubId: string,
  amount: number,
  type: WalletTxType,
  note: { noteFa: string; noteEn: string },
  referenceId?: string,
) {
  const wallet = await ensureClubWallet(tx, clubId)
  const balanceAfter = wallet.balance + amount
  await tx.clubWallet.update({ where: { clubId }, data: { balance: balanceAfter } })
  await tx.walletTransaction.create({
    data: {
      type,
      amount,
      balanceAfter,
      clubId,
      referenceId,
      noteFa: note.noteFa,
      noteEn: note.noteEn,
    },
  })
  return balanceAfter
}

async function debitClubWallet(
  tx: TxClient,
  clubId: string,
  amount: number,
  type: WalletTxType,
  note: { noteFa: string; noteEn: string },
  referenceId?: string,
) {
  const wallet = await ensureClubWallet(tx, clubId)
  if (wallet.balance < amount) {
    throw createError({ statusCode: 402, statusMessage: 'Insufficient club wallet balance' })
  }
  const balanceAfter = wallet.balance - amount
  await tx.clubWallet.update({ where: { clubId }, data: { balance: balanceAfter } })
  await tx.walletTransaction.create({
    data: {
      type,
      amount: -amount,
      balanceAfter,
      clubId,
      referenceId,
      noteFa: note.noteFa,
      noteEn: note.noteEn,
    },
  })
  return balanceAfter
}

function splitPayment(total: number) {
  const platformFee = Math.round((total * PLATFORM_FEE_PERCENT) / 100)
  const net = total - platformFee
  return { platformFee, net }
}

export async function topUpUserWallet(userId: string, amount: number) {
  if (amount < 10000 || amount > 50_000_000) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid top-up amount' })
  }
  return prisma.$transaction(async (tx) => {
    const balanceAfter = await creditUserWallet(
      tx,
      userId,
      amount,
      'TOP_UP',
      { noteFa: 'شارژ کیف پول', noteEn: 'Wallet top-up' },
    )
    return { balance: balanceAfter }
  })
}

export async function payoutClubWallet(userId: string, clubId: string, amount: number) {
  const club = await prisma.club.findFirst({ where: { id: clubId, ownerId: userId } })
  if (!club) throw createError({ statusCode: 404, statusMessage: 'Club not found' })

  if (amount < 10000) {
    throw createError({ statusCode: 400, statusMessage: 'Minimum payout is 10,000' })
  }

  return prisma.$transaction(async (tx) => {
    const balanceAfter = await debitClubWallet(
      tx,
      clubId,
      amount,
      'PAYOUT',
      { noteFa: 'برداشت به حساب بانکی', noteEn: 'Bank payout' },
    )
    return { balance: balanceAfter }
  })
}

export async function payBookingFromWallet(userId: string, slotId: string, bookingId: string, price: number, clubId: string) {
  return prisma.$transaction((tx) => payBookingFromWalletTx(tx, userId, bookingId, price, clubId))
}

export async function payBookingFromWalletTx(
  tx: TxClient,
  userId: string,
  bookingId: string,
  price: number,
  clubId: string,
) {
  const { platformFee, net } = splitPayment(price)

  await debitUserWallet(
    tx,
    userId,
    price,
    'BOOKING',
    { noteFa: 'پرداخت رزرو زمین', noteEn: 'Court booking payment' },
    bookingId,
  )
  await creditClubWallet(
    tx,
    clubId,
    net,
    'BOOKING',
    { noteFa: 'دریافت رزرو زمین', noteEn: 'Court booking received' },
    bookingId,
  )

  const admin = await tx.user.findFirst({ where: { role: 'PLATFORM_ADMIN' }, select: { id: true } })
  if (admin && platformFee > 0) {
    await creditUserWallet(
      tx,
      admin.id,
      platformFee,
      'PLATFORM_FEE',
      { noteFa: 'کارمزد پلتفرم — رزرو', noteEn: 'Platform fee — booking' },
      bookingId,
    )
  }
}

export async function refundBookingToWallet(userId: string, bookingId: string, price: number, clubId: string, wasPaid: boolean) {
  if (!wasPaid) return

  const { platformFee, net } = splitPayment(price)

  return prisma.$transaction(async (tx) => {
    await debitClubWallet(
      tx,
      clubId,
      net,
      'REFUND',
      { noteFa: 'بازگشت رزرو لغو‌شده', noteEn: 'Cancelled booking refund' },
      bookingId,
    )
    await creditUserWallet(
      tx,
      userId,
      price,
      'REFUND',
      { noteFa: 'بازگشت وجه رزرو', noteEn: 'Booking refund' },
      bookingId,
    )

    const admin = await tx.user.findFirst({ where: { role: 'PLATFORM_ADMIN' }, select: { id: true } })
    if (admin && platformFee > 0) {
      await debitUserWallet(
        tx,
        admin.id,
        platformFee,
        'REFUND',
        { noteFa: 'برگشت کارمزد پلتفرم', noteEn: 'Platform fee reversal' },
        bookingId,
      )
    }
  })
}

export async function payClassFromWallet(
  userId: string,
  classSessionId: string,
  price: number,
  clubId: string,
  coachUserId?: string | null,
) {
  const { platformFee, net } = splitPayment(price)
  const coachShare = coachUserId ? Math.round((price * COACH_SHARE_PERCENT) / 100) : 0
  const clubShare = net - coachShare

  return prisma.$transaction(async (tx) => {
    await debitUserWallet(
      tx,
      userId,
      price,
      'CLASS',
      { noteFa: 'پرداخت کلاس', noteEn: 'Class enrollment payment' },
      classSessionId,
    )
    if (clubShare > 0) {
      await creditClubWallet(
        tx,
        clubId,
        clubShare,
        'CLASS',
        { noteFa: 'دریافت ثبت‌نام کلاس', noteEn: 'Class enrollment received' },
        classSessionId,
      )
    }
    if (coachUserId && coachShare > 0) {
      await creditUserWallet(
        tx,
        coachUserId,
        coachShare,
        'COACH_EARNING',
        { noteFa: 'درآمد مربی — کلاس', noteEn: 'Coach earning — class' },
        classSessionId,
      )
      await debitClubWallet(
        tx,
        clubId,
        coachShare,
        'COACH_EARNING',
        { noteFa: 'سهم مربی — کلاس', noteEn: 'Coach share — class' },
        classSessionId,
      )
    }

    const admin = await tx.user.findFirst({ where: { role: 'PLATFORM_ADMIN' }, select: { id: true } })
    if (admin && platformFee > 0) {
      await creditUserWallet(
        tx,
        admin.id,
        platformFee,
        'PLATFORM_FEE',
        { noteFa: 'کارمزد پلتفرم — کلاس', noteEn: 'Platform fee — class' },
        classSessionId,
      )
    }
  })
}

export async function getUserWalletSummary(userId: string) {
  const wallet = await ensureUserWallet(prisma, userId)
  const transactions = await prisma.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return { balance: wallet.balance, transactions }
}

export async function getClubWalletSummary(clubId: string) {
  const wallet = await ensureClubWallet(prisma, clubId)
  const transactions = await prisma.walletTransaction.findMany({
    where: { clubId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return { balance: wallet.balance, transactions }
}

export async function getClubFinanceStats(ownerId: string, clubId?: string) {
  const clubs = await prisma.club.findMany({
    where: { ownerId, ...(clubId ? { id: clubId } : {}) },
    include: { wallet: true },
  })
  const clubIds = clubs.map((c) => c.id)
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${today.slice(0, 7)}-01`

  const incoming = await prisma.walletTransaction.findMany({
    where: {
      clubId: { in: clubIds },
      type: { in: ['BOOKING', 'CLASS'] },
      amount: { gt: 0 },
    },
  })

  let todayRevenue = 0
  let monthRevenue = 0
  let totalRevenue = 0
  for (const tx of incoming) {
    totalRevenue += tx.amount
    const day = tx.createdAt.toISOString().slice(0, 10)
    if (day === today) todayRevenue += tx.amount
    if (day >= monthStart) monthRevenue += tx.amount
  }

  const walletBalance = clubs.reduce((sum, c) => sum + (c.wallet?.balance ?? 0), 0)
  const bookingCount = await prisma.booking.count({
    where: { status: { not: 'CANCELLED' }, slot: { court: { clubId: { in: clubIds } } } },
  })
  const pendingBookings = await prisma.booking.count({
    where: {
      paymentStatus: 'PAY_AT_CLUB',
      status: 'CONFIRMED',
      slot: { court: { clubId: { in: clubIds } } },
    },
  })
  const classEnrollments = await prisma.classEnrollment.count({
    where: { classSession: { clubId: { in: clubIds } } },
  })

  return {
    todayRevenue,
    monthRevenue,
    totalRevenue,
    walletBalance,
    bookingCount,
    pendingBookings,
    classEnrollments,
  }
}

export async function getPlatformStats() {
  const [users, clubs, bookings, classes, admin] = await Promise.all([
    prisma.user.count(),
    prisma.club.count(),
    prisma.booking.count({ where: { status: { not: 'CANCELLED' } } }),
    prisma.classEnrollment.count(),
    prisma.user.findFirst({ where: { role: 'PLATFORM_ADMIN' }, include: { wallet: true } }),
  ])

  const fees = await prisma.walletTransaction.aggregate({
    where: { type: 'PLATFORM_FEE' },
    _sum: { amount: true },
  })

  const recentTx = await prisma.walletTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      user: { select: { name: true, role: true } },
      club: { select: { nameFa: true, nameEn: true } },
    },
  })

  return {
    users,
    clubs,
    bookings,
    classEnrollments: classes,
    platformFees: fees._sum.amount ?? 0,
    walletBalance: admin?.wallet?.balance ?? 0,
    recentTransactions: recentTx,
  }
}

export async function ensureWalletsForUser(userId: string) {
  await ensureUserWallet(prisma, userId)
}
