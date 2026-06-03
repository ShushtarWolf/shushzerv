const DEFAULT_TIMES = [
  { startTime: '08:00', endTime: '09:30' },
  { startTime: '10:00', endTime: '11:30' },
  { startTime: '12:00', endTime: '13:30' },
  { startTime: '16:00', endTime: '17:30' },
  { startTime: '18:00', endTime: '19:30' },
  { startTime: '20:00', endTime: '21:30' },
]

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{ courtId?: string; date?: string; price?: number }>(event)

  if (!body.courtId || !body.date) {
    throw createError({ statusCode: 400, statusMessage: 'courtId and date are required' })
  }

  const court = await prisma.court.findFirst({
    where: { id: body.courtId, club: { ownerId: user.id } },
    include: { club: true },
  })
  if (!court) throw createError({ statusCode: 403, statusMessage: 'Not your court' })

  const price = body.price && body.price > 0 ? body.price : court.club.priceFrom

  const existing = await prisma.slot.findMany({
    where: { courtId: body.courtId, date: body.date },
    select: { startTime: true },
  })
  const existingTimes = new Set(existing.map((s) => s.startTime))

  const toCreate = DEFAULT_TIMES.filter((t) => !existingTimes.has(t.startTime)).map((t) => ({
    courtId: body.courtId!,
    date: body.date!,
    startTime: t.startTime,
    endTime: t.endTime,
    price,
    status: 'AVAILABLE' as const,
  }))

  if (toCreate.length) {
    await prisma.slot.createMany({ data: toCreate })
  }

  return { created: toCreate.length }
})
