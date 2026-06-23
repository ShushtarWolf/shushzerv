import { eachDateInRange, generateSlotsForCourtDate, resolveSlotGenerationParams } from '../../../utils/clubSlots'

const MAX_BULK_DAYS = 31

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    courtId?: string
    fromDate?: string
    toDate?: string
    price?: number
    durationMinutes?: number
  }>(event)

  if (!body.courtId || !body.fromDate || !body.toDate) {
    throw createError({ statusCode: 400, statusMessage: 'courtId, fromDate and toDate are required' })
  }

  const court = await prisma.court.findFirst({
    where: { id: body.courtId, club: { ownerId: user.id } },
    include: { club: true },
  })
  if (!court) throw createError({ statusCode: 403, statusMessage: 'Not your court' })

  const dates = eachDateInRange(body.fromDate, body.toDate)
  if (!dates.length) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid date range' })
  }
  if (dates.length > MAX_BULK_DAYS) {
    throw createError({ statusCode: 400, statusMessage: `Maximum ${MAX_BULK_DAYS} days per request` })
  }

  const { durationMinutes, openTime, closeTime, price } = resolveSlotGenerationParams(court.club, body)

  let created = 0
  for (const date of dates) {
    created += await generateSlotsForCourtDate({
      courtId: body.courtId,
      date,
      durationMinutes,
      openTime,
      closeTime,
      price,
    })
  }

  return { created, days: dates.length, durationMinutes }
})
