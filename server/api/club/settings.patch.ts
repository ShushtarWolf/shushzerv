import {
  buildSlotTimes,
  normalizeSlotDuration,
  normalizeTimeValue,
  parseTimeToMinutes,
} from '../../utils/slotSchedule'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    clubId?: string
    slotDurationMinutes?: number
    slotOpenTime?: string
    slotCloseTime?: string
    cancellationPolicyFa?: string
    cancellationPolicyEn?: string
    cancellationHours?: number
  }>(event)

  if (!body.clubId) {
    throw createError({ statusCode: 400, statusMessage: 'clubId is required' })
  }

  const club = await prisma.club.findFirst({
    where: { id: body.clubId, ownerId: user.id },
  })
  if (!club) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const slotDurationMinutes = body.slotDurationMinutes != null
    ? normalizeSlotDuration(body.slotDurationMinutes)
    : club.slotDurationMinutes
  const slotOpenTime = body.slotOpenTime != null
    ? normalizeTimeValue(body.slotOpenTime, club.slotOpenTime)
    : club.slotOpenTime
  const slotCloseTime = body.slotCloseTime != null
    ? normalizeTimeValue(body.slotCloseTime, club.slotCloseTime)
    : club.slotCloseTime

  if (parseTimeToMinutes(slotCloseTime) <= parseTimeToMinutes(slotOpenTime)) {
    throw createError({ statusCode: 400, statusMessage: 'Close time must be after open time' })
  }

  if (!buildSlotTimes(slotDurationMinutes, slotOpenTime, slotCloseTime).length) {
    throw createError({ statusCode: 400, statusMessage: 'No slots fit in this schedule window' })
  }

  return prisma.club.update({
    where: { id: body.clubId },
    data: {
      slotDurationMinutes,
      slotOpenTime,
      slotCloseTime,
      ...(body.cancellationPolicyFa !== undefined ? { cancellationPolicyFa: body.cancellationPolicyFa } : {}),
      ...(body.cancellationPolicyEn !== undefined ? { cancellationPolicyEn: body.cancellationPolicyEn } : {}),
      ...(body.cancellationHours !== undefined ? { cancellationHours: body.cancellationHours } : {}),
    },
    include: { courts: { include: { sport: true } } },
  })
})
