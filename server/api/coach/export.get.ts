export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach not found' })

  const [sessions, earnings] = await Promise.all([
    prisma.coachSession.findMany({
      where: { coachId: coach.id },
      include: { athlete: { select: { name: true, email: true } } },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    }),
    prisma.walletTransaction.findMany({
      where: { userId: user.id, type: { in: ['COACH_EARNING', 'COACH_SESSION', 'PAYOUT'] } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const sessionHeader = 'type,id,date,start,end,athlete,email,status,payment,price\n'
  const sessionRows = sessions.map((s) =>
    [
      'session',
      s.id,
      s.date,
      s.startTime,
      s.endTime,
      s.athlete?.name ?? '',
      s.athlete?.email ?? '',
      s.status,
      s.paymentStatus,
      s.price,
    ].join(','),
  )

  const earningsHeader = '\n\ntype,id,amount,balanceAfter,note,createdAt\n'
  const earningsRows = earnings.map((tx) =>
    [
      tx.type,
      tx.id,
      tx.amount,
      tx.balanceAfter,
      (tx.noteEn ?? tx.noteFa ?? '').replace(/,/g, ' '),
      tx.createdAt.toISOString(),
    ].join(','),
  )

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename=coach-export.csv')
  return sessionHeader + sessionRows.join('\n') + earningsHeader + earningsRows.join('\n')
})
