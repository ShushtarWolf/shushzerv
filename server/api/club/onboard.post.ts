import { eachDateInRange, generateSlotsForCourtDate, resolveSlotGenerationParams } from '../../utils/clubSlots'
import { buildSlotTimes, normalizeSlotDuration, normalizeTimeValue } from '../../utils/slotSchedule'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    addressFa?: string
    addressEn?: string
    city?: string
    district?: string
    priceFrom?: number
    image?: string
    courtNameFa?: string
    courtNameEn?: string
    courtSportId?: string
    slotDurationMinutes?: number
    slotOpenTime?: string
    slotCloseTime?: string
    generateFromDate?: string
    generateToDate?: string
    slotPrice?: number
  }>(event)

  const addressFa = body.addressFa?.trim()
  if (!addressFa) throw createError({ statusCode: 400, statusMessage: 'Address is required' })

  const club = await prisma.club.findFirst({
    where: { ownerId: user.id },
    include: { courts: { orderBy: { nameFa: 'asc' } } },
  })
  if (!club) throw createError({ statusCode: 404, statusMessage: 'Club not found' })

  const priceFrom = body.priceFrom !== undefined ? Math.round(body.priceFrom) : club.priceFrom
  if (priceFrom < 0 || priceFrom > 50_000_000) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid price' })
  }

  const slotDurationMinutes = body.slotDurationMinutes ?? club.slotDurationMinutes
  const slotOpenTime = body.slotOpenTime ?? club.slotOpenTime
  const slotCloseTime = body.slotCloseTime ?? club.slotCloseTime

  if (!buildSlotTimes(slotDurationMinutes, slotOpenTime, slotCloseTime).length) {
    throw createError({ statusCode: 400, statusMessage: 'No slots fit in this schedule window' })
  }

  const primaryCourt = club.courts[0]
  if (!primaryCourt) throw createError({ statusCode: 400, statusMessage: 'No court found' })

  let slotsCreated = 0

  await prisma.$transaction(async (tx) => {
    await tx.club.update({
      where: { id: club.id },
      data: {
        addressFa,
        addressEn: body.addressEn?.trim() || addressFa,
        city: body.city?.trim() || club.city,
        district: body.district?.trim() || null,
        priceFrom,
        image: body.image?.trim() || null,
        slotDurationMinutes: normalizeSlotDuration(slotDurationMinutes),
        slotOpenTime: normalizeTimeValue(slotOpenTime, club.slotOpenTime),
        slotCloseTime: normalizeTimeValue(slotCloseTime, club.slotCloseTime),
      },
    })

    if (body.courtNameFa?.trim() || body.courtSportId) {
      await tx.court.update({
        where: { id: primaryCourt.id },
        data: {
          ...(body.courtNameFa?.trim() ? { nameFa: body.courtNameFa.trim() } : {}),
          ...(body.courtNameEn?.trim() ? { nameEn: body.courtNameEn.trim() } : {}),
          ...(body.courtSportId ? { sportId: body.courtSportId } : {}),
        },
      })
    }

    await tx.user.update({
      where: { id: user.id },
      data: { onboardedAt: new Date() },
    })
  })

  if (body.generateFromDate && body.generateToDate) {
    const dates = eachDateInRange(body.generateFromDate, body.generateToDate)
    const { durationMinutes, openTime, closeTime, price } = resolveSlotGenerationParams(
      {
        slotDurationMinutes: normalizeSlotDuration(slotDurationMinutes),
        slotOpenTime: normalizeTimeValue(slotOpenTime, '08:00'),
        slotCloseTime: normalizeTimeValue(slotCloseTime, '22:00'),
        priceFrom,
      },
      { price: body.slotPrice },
    )

    for (const date of dates.slice(0, 31)) {
      slotsCreated += await generateSlotsForCourtDate({
        courtId: primaryCourt.id,
        date,
        durationMinutes,
        openTime,
        closeTime,
        price,
      })
    }
  }

  const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  await setUserSession(event, { user: toSessionUser(updated) })

  return { ok: true, slotsCreated }
})
