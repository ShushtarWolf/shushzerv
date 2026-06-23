function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function lastNMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function bucketByDay(items: { createdAt: Date; amount: number }[], days: string[]) {
  const map = new Map(days.map((d) => [d, 0]))
  for (const item of items) {
    const day = item.createdAt.toISOString().slice(0, 10)
    if (map.has(day)) map.set(day, (map.get(day) ?? 0) + item.amount)
  }
  return days.map((d) => map.get(d) ?? 0)
}

function bucketCountByDay(items: { createdAt: Date }[], days: string[]) {
  const map = new Map(days.map((d) => [d, 0]))
  for (const item of items) {
    const day = item.createdAt.toISOString().slice(0, 10)
    if (map.has(day)) map.set(day, (map.get(day) ?? 0) + 1)
  }
  return days.map((d) => map.get(d) ?? 0)
}

function bucketCountByMonth(items: { createdAt: Date }[], months: string[]) {
  const map = new Map(months.map((m) => [m, 0]))
  for (const item of items) {
    const month = item.createdAt.toISOString().slice(0, 7)
    if (map.has(month)) map.set(month, (map.get(month) ?? 0) + 1)
  }
  return months.map((m) => map.get(m) ?? 0)
}

function bucketSumByMonth(items: { createdAt: Date; amount: number }[], months: string[]) {
  const map = new Map(months.map((m) => [m, 0]))
  for (const item of items) {
    const month = item.createdAt.toISOString().slice(0, 7)
    if (map.has(month)) map.set(month, (map.get(month) ?? 0) + item.amount)
  }
  return months.map((m) => map.get(m) ?? 0)
}

function dayOfWeekIndex(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).getDay()
}

export async function getAthleteChartData(userId: string) {
  const days = lastNDays(7)

  const [spendingTx, bookings, classes, matches] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId, type: { in: ['BOOKING', 'CLASS'] } },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.booking.findMany({
      where: { userId, status: { not: 'CANCELLED' } },
      select: { createdAt: true },
    }),
    prisma.classEnrollment.findMany({
      where: { userId },
      select: { createdAt: true },
    }),
    prisma.matchParticipant.findMany({
      where: { userId },
      select: { joinedAt: true },
    }),
  ])

  const spending = bucketByDay(
    spendingTx.map((tx) => ({ createdAt: tx.createdAt, amount: Math.abs(tx.amount) })),
    days,
  )
  const bookingTrend = bucketCountByDay(bookings, days)
  const classTrend = bucketCountByDay(classes, days)
  const matchTrend = bucketCountByDay(
    matches.map((m) => ({ createdAt: m.joinedAt })),
    days,
  )

  return {
    labels: days,
    spending,
    bookingTrend,
    classTrend,
    matchTrend,
    breakdown: [
      { key: 'bookings', value: bookings.length },
      { key: 'classes', value: classes.length },
      { key: 'matches', value: matches.length },
    ],
  }
}

export async function getClubChartData(ownerId: string, clubId?: string) {
  const days = lastNDays(7)
  const clubs = await prisma.club.findMany({
    where: { ownerId, ...(clubId ? { id: clubId } : {}) },
    select: { id: true },
  })
  const clubIds = clubs.map((c) => c.id)

  const [revenueTx, bookings, classEnrollments] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: {
        clubId: { in: clubIds },
        type: { in: ['BOOKING', 'CLASS'] },
        amount: { gt: 0 },
      },
      select: { createdAt: true, amount: true, type: true },
    }),
    prisma.booking.findMany({
      where: { status: { not: 'CANCELLED' }, slot: { court: { clubId: { in: clubIds } } } },
      select: { createdAt: true },
    }),
    prisma.classEnrollment.findMany({
      where: { classSession: { clubId: { in: clubIds } } },
      select: { createdAt: true },
    }),
  ])

  const revenue = bucketByDay(revenueTx, days)
  const bookingTrend = bucketCountByDay(bookings, days)
  const classTrend = bucketCountByDay(classEnrollments, days)

  const dowLabels = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const bookingByDow = [0, 0, 0, 0, 0, 0, 0]
  const classByDow = [0, 0, 0, 0, 0, 0, 0]
  for (const b of bookings) {
    bookingByDow[dayOfWeekIndex(b.createdAt.toISOString().slice(0, 10))]!++
  }
  for (const c of classEnrollments) {
    classByDow[dayOfWeekIndex(c.createdAt.toISOString().slice(0, 10))]!++
  }

  const bookingRevenue = revenueTx.filter((tx) => tx.type === 'BOOKING')
  const classRevenue = revenueTx.filter((tx) => tx.type === 'CLASS')

  return {
    labels: days,
    revenue,
    bookingTrend,
    classTrend,
    dowLabels,
    bookingByDow,
    classByDow,
    breakdown: [
      { key: 'bookings', value: bookingRevenue.reduce((s, tx) => s + tx.amount, 0) },
      { key: 'classes', value: classRevenue.reduce((s, tx) => s + tx.amount, 0) },
    ],
  }
}

export async function getCoachChartData(userId: string) {
  const days = lastNDays(7)
  const coach = await prisma.coach.findUnique({ where: { userId } })
  if (!coach) {
    return {
      labels: days,
      earnings: days.map(() => 0),
      sessionTrend: days.map(() => 0),
      breakdown: [
        { key: 'sessions', value: 0 },
        { key: 'students', value: 0 },
        { key: 'rating', value: 0 },
      ],
    }
  }

  const [earningsTx, sessions, students] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId, type: 'COACH_EARNING' },
      select: { createdAt: true, amount: true },
    }),
    prisma.coachSession.findMany({
      where: { coachId: coach.id, status: { not: 'CANCELLED' } },
      select: { date: true, createdAt: true },
    }),
    prisma.planAssignment.findMany({
      where: { plan: { coachId: coach.id } },
      select: { athleteId: true },
    }),
  ])

  const earnings = bucketByDay(earningsTx, days)
  const sessionTrend = bucketCountByDay(
    sessions.map((s) => ({ createdAt: new Date(`${s.date}T12:00:00`) })),
    days,
  )

  const uniqueStudents = new Set(students.map((s) => s.athleteId)).size

  return {
    labels: days,
    earnings,
    sessionTrend,
    breakdown: [
      { key: 'sessions', value: coach.sessions },
      { key: 'students', value: uniqueStudents },
      { key: 'rating', value: Math.round(coach.rating * 10) },
    ],
  }
}

export async function getPlatformChartData() {
  const months = lastNMonths(6)

  const [users, clubs, bookings, feesTx] = await Promise.all([
    prisma.user.findMany({ select: { createdAt: true } }),
    prisma.club.findMany({ select: { createdAt: true } }),
    prisma.booking.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { createdAt: true },
    }),
    prisma.walletTransaction.findMany({
      where: { type: 'PLATFORM_FEE' },
      select: { createdAt: true, amount: true },
    }),
  ])

  return {
    labels: months,
    users: bucketCountByMonth(users, months),
    clubs: bucketCountByMonth(clubs, months),
    bookings: bucketCountByMonth(bookings, months),
    fees: bucketSumByMonth(feesTx, months),
  }
}
