import type { SkillLevel } from '@prisma/client'
import {
  assertCoachCanRateClass,
  assertCoachCanRateSession,
  assertPeerCanRate,
  parseSkillLevelInput,
  recalculateAthleteLevel,
} from '../../utils/skillRating'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{
    ratedUserId?: string
    level?: SkillLevel
    classSessionId?: string
    coachSessionId?: string
  }>(event)

  const ratedUserId = body.ratedUserId?.trim()
  const level = parseSkillLevelInput(body.level)
  const classSessionId = body.classSessionId?.trim() || null
  const coachSessionId = body.coachSessionId?.trim() || null

  if (!ratedUserId || !level) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid rating data' })
  }
  if ((!classSessionId && !coachSessionId) || (classSessionId && coachSessionId)) {
    throw createError({ statusCode: 400, statusMessage: 'Provide either classSessionId or coachSessionId' })
  }

  const ratedUser = await prisma.user.findUnique({
    where: { id: ratedUserId },
    include: { athleteProfile: true },
  })
  if (!ratedUser?.athleteProfile) {
    throw createError({ statusCode: 404, statusMessage: 'Athlete not found' })
  }

  let sportId: string

  if (classSessionId) {
    const session = user.role === 'COACH'
      ? (await assertCoachCanRateClass(user.id, classSessionId, ratedUserId)).session
      : await assertPeerCanRate(user.id, ratedUserId, classSessionId)

    sportId = session.sportId
    const source = user.role === 'COACH' ? 'COACH' : 'PEER'

    const existing = await prisma.skillRating.findFirst({
      where: { raterId: user.id, ratedUserId, classSessionId },
    })
    if (existing) throw createError({ statusCode: 409, statusMessage: 'Rating already submitted' })

    await prisma.skillRating.create({
      data: {
        ratedUserId,
        raterId: user.id,
        classSessionId,
        sportId,
        level,
        source,
      },
    })
  } else {
    const { session } = await assertCoachCanRateSession(user.id, coachSessionId!, ratedUserId)
    sportId = session.coach.sportId

    const existing = await prisma.skillRating.findFirst({
      where: { raterId: user.id, ratedUserId, coachSessionId },
    })
    if (existing) throw createError({ statusCode: 409, statusMessage: 'Rating already submitted' })

    await prisma.skillRating.create({
      data: {
        ratedUserId,
        raterId: user.id,
        coachSessionId,
        sportId,
        level,
        source: 'COACH',
      },
    })
  }

  const updatedLevel = await recalculateAthleteLevel(ratedUserId, sportId)
  return { ok: true, level: updatedLevel }
})
