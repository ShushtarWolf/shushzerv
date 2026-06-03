export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const courtId = typeof query.courtId === 'string' ? query.courtId : undefined
  const clubId = typeof query.clubId === 'string' ? query.clubId : undefined
  const date = typeof query.date === 'string' ? query.date : undefined
  const onlyAvailable = query.available === 'true'

  if (!courtId && !clubId) {
    throw createError({ statusCode: 400, statusMessage: 'courtId or clubId required' })
  }

  return prisma.slot.findMany({
    where: {
      ...(courtId ? { courtId } : {}),
      ...(clubId ? { court: { clubId } } : {}),
      ...(date ? { date } : {}),
      ...(onlyAvailable ? { status: 'AVAILABLE' } : {}),
    },
    include: { court: { include: { sport: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })
})
