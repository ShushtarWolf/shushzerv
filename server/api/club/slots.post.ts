import { generateSlotsForCourtDate, resolveSlotGenerationParams } from '../../utils/clubSlots'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    courtId?: string
    date?: string
    price?: number
    durationMinutes?: number
  }>(event)

  if (!body.courtId || !body.date) {
    throw createError({ statusCode: 400, statusMessage: 'courtId and date are required' })
  }

  const court = await prisma.court.findFirst({
    where: { id: body.courtId, club: { ownerId: user.id } },
    include: { club: true },
  })
  if (!court) throw createError({ statusCode: 403, statusMessage: 'Not your court' })

  const { durationMinutes, openTime, closeTime, price } = resolveSlotGenerationParams(court.club, body)

  const created = await generateSlotsForCourtDate({
    courtId: body.courtId,
    date: body.date,
    durationMinutes,
    openTime,
    closeTime,
    price,
  })

  return { created, durationMinutes }
})
