export default defineEventHandler(async (event) => {
  const { clubId, courtId, date, status } = getQuery(event)

  const slots = await prisma.slot.findMany({
    where: {
      ...(courtId ? { courtId: String(courtId) } : {}),
      ...(clubId ? { court: { clubId: String(clubId) } } : {}),
      ...(date ? { date: String(date) } : {}),
      ...(status ? { status: String(status) as any } : {}),
    },
    include: { court: { include: { sport: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  return slots
})
