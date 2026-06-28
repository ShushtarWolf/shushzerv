import { defaultMaxSeatsForType, parseClassSessionFields } from '../../utils/classSession'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    clubId?: string
    sportId?: string
    coachId?: string
    titleFa?: string
    titleEn?: string
    date?: string
    startTime?: string
    endTime?: string
    price?: number
    maxSeats?: number
    classType?: string
    genderPolicy?: string
    minLevel?: string
    maxLevel?: string
  }>(event)

  if (!body.clubId || !body.sportId || !body.titleFa || !body.date || !body.startTime || !body.endTime) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const club = await prisma.club.findFirst({ where: { id: body.clubId, ownerId: user.id } })
  if (!club) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const classType = (body.classType === 'SEMI_PRIVATE' ? 'SEMI_PRIVATE' : 'GROUP') as 'GROUP' | 'SEMI_PRIVATE'
  const extra = parseClassSessionFields({
    classType,
    genderPolicy: body.genderPolicy,
    minLevel: body.minLevel,
    maxLevel: body.maxLevel,
    maxSeats: body.maxSeats ?? defaultMaxSeatsForType(classType),
  })

  return prisma.classSession.create({
    data: {
      clubId: body.clubId,
      sportId: body.sportId,
      coachId: body.coachId || null,
      titleFa: body.titleFa,
      titleEn: body.titleEn || body.titleFa,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      price: body.price ?? club.priceFrom,
      maxSeats: body.maxSeats ?? defaultMaxSeatsForType(classType),
      classType,
      genderPolicy: extra.genderPolicy ?? 'MIXED',
      minLevel: extra.minLevel ?? 'BEGINNER',
      maxLevel: extra.maxLevel ?? 'PRO',
    },
  })
})
