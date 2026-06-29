import { datesMatchingWeekdays } from '#shared/scheduleWeekday'
import { parseDaysOfWeek } from '#shared/classPackage'
import { blockSlotsForClassSession } from '../../../utils/classSlots'
import { defaultMaxSeatsForType, parseClassSessionFields } from '../../../utils/classSession'

const MAX_BULK_CLASS_DAYS = 90

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    clubId?: string
    sportId?: string
    coachId?: string
    titleFa?: string
    titleEn?: string
    fromDate?: string
    toDate?: string
    daysOfWeek?: string
    startTime?: string
    endTime?: string
    price?: number
    maxSeats?: number
    classType?: string
    genderPolicy?: string
    minLevel?: string
    maxLevel?: string
    courtIds?: string[]
  }>(event)

  if (
    !body.clubId || !body.sportId || !body.titleFa
    || !body.fromDate || !body.toDate || !body.startTime || !body.endTime
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const club = await prisma.club.findFirst({ where: { id: body.clubId, ownerId: user.id } })
  if (!club) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const daysOfWeek = parseDaysOfWeek(body.daysOfWeek)
  const dates = datesMatchingWeekdays(body.fromDate, body.toDate, daysOfWeek)
  if (!dates.length) {
    throw createError({ statusCode: 400, statusMessage: 'No matching dates in range' })
  }
  if (dates.length > MAX_BULK_CLASS_DAYS) {
    throw createError({ statusCode: 400, statusMessage: `Maximum ${MAX_BULK_CLASS_DAYS} class sessions per request` })
  }

  const classType = (body.classType === 'SEMI_PRIVATE' ? 'SEMI_PRIVATE' : 'GROUP') as 'GROUP' | 'SEMI_PRIVATE'
  const extra = parseClassSessionFields({
    classType,
    genderPolicy: body.genderPolicy,
    minLevel: body.minLevel,
    maxLevel: body.maxLevel,
    maxSeats: body.maxSeats ?? defaultMaxSeatsForType(classType),
  })

  const existing = await prisma.classSession.findMany({
    where: {
      clubId: body.clubId,
      date: { in: dates },
      startTime: body.startTime,
      titleFa: body.titleFa,
      status: { not: 'CANCELLED' },
    },
    select: { date: true },
  })
  const existingDates = new Set(existing.map((e) => e.date))
  const toCreate = dates.filter((date) => !existingDates.has(date))

  if (!toCreate.length) {
    return { created: 0, skipped: dates.length }
  }

  const courtIds = body.courtIds?.filter(Boolean)

  await prisma.$transaction(async (tx) => {
    await tx.classSession.createMany({
      data: toCreate.map((date) => ({
        clubId: body.clubId!,
        sportId: body.sportId!,
        coachId: body.coachId || null,
        titleFa: body.titleFa!,
        titleEn: body.titleEn || body.titleFa!,
        date,
        startTime: body.startTime!,
        endTime: body.endTime!,
        price: body.price ?? club.priceFrom,
        maxSeats: body.maxSeats ?? defaultMaxSeatsForType(classType),
        classType,
        genderPolicy: extra.genderPolicy ?? 'MIXED',
        minLevel: extra.minLevel ?? 'BEGINNER',
        maxLevel: extra.maxLevel ?? 'PRO',
      })),
    })

    for (const date of toCreate) {
      await blockSlotsForClassSession({
        clubId: body.clubId!,
        sportId: body.sportId!,
        date,
        startTime: body.startTime!,
        endTime: body.endTime!,
        courtIds,
      }, tx)
    }
  })

  return { created: toCreate.length, skipped: dates.length - toCreate.length }
})
