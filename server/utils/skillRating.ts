import type { SkillLevel, SkillRatingSource } from '@prisma/client'
import { levelToScore, scoreToLevel } from '../../shared/skillQuiz'

const SOURCE_WEIGHT: Record<SkillRatingSource, number> = {
  QUIZ: 1,
  PEER: 1,
  COACH: 2,
}

export function classSessionEnded(date: string, endTime: string): boolean {
  const end = new Date(`${date}T${endTime}:00`)
  return end.getTime() <= Date.now()
}

export async function recalculateAthleteLevel(userId: string, sportId: string) {
  const ratings = await prisma.skillRating.findMany({
    where: { ratedUserId: userId, sportId },
    select: { level: true, source: true },
  })
  if (!ratings.length) return null

  let weightedSum = 0
  let weightTotal = 0
  for (const r of ratings) {
    const w = SOURCE_WEIGHT[r.source]
    weightedSum += levelToScore(r.level) * w
    weightTotal += w
  }
  const level = scoreToLevel(weightedSum / weightTotal)

  await prisma.athleteProfile.updateMany({
    where: { userId, sportId },
    data: { level },
  })
  return level
}

export async function assertCoachCanRateClass(coachUserId: string, classSessionId: string, athleteId: string) {
  const coach = await prisma.coach.findUnique({ where: { userId: coachUserId } })
  if (!coach) throw createError({ statusCode: 403, statusMessage: 'Coach profile required' })

  const session = await prisma.classSession.findUnique({
    where: { id: classSessionId },
    include: { enrollments: { where: { userId: athleteId } } },
  })
  if (!session || session.coachId !== coach.id) {
    throw createError({ statusCode: 403, statusMessage: 'You can only rate players from your own classes' })
  }
  if (!session.enrollments.length) {
    throw createError({ statusCode: 403, statusMessage: 'Athlete was not enrolled in this class' })
  }
  if (session.status === 'CANCELLED') {
    throw createError({ statusCode: 403, statusMessage: 'Class was cancelled' })
  }
  if (!classSessionEnded(session.date, session.endTime)) {
    throw createError({ statusCode: 403, statusMessage: 'Class has not finished yet' })
  }
  return { session, coach }
}

export async function assertCoachCanRateSession(coachUserId: string, coachSessionId: string, athleteId: string) {
  const coach = await prisma.coach.findUnique({ where: { userId: coachUserId } })
  if (!coach) throw createError({ statusCode: 403, statusMessage: 'Coach profile required' })

  const session = await prisma.coachSession.findUnique({
    where: { id: coachSessionId },
    include: { coach: true },
  })
  if (!session || session.coachId !== coach.id || session.athleteId !== athleteId) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid coach session for this athlete' })
  }
  if (session.status === 'CANCELLED') {
    throw createError({ statusCode: 403, statusMessage: 'Session was cancelled' })
  }
  if (!classSessionEnded(session.date, session.endTime)) {
    throw createError({ statusCode: 403, statusMessage: 'Session has not finished yet' })
  }
  return { session, coach }
}

export async function assertPeerCanRate(raterId: string, ratedUserId: string, classSessionId: string) {
  if (raterId === ratedUserId) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot rate yourself' })
  }

  const session = await prisma.classSession.findUnique({
    where: { id: classSessionId },
    include: {
      enrollments: { where: { userId: { in: [raterId, ratedUserId] } } },
    },
  })
  if (!session || session.enrollments.length < 2) {
    throw createError({ statusCode: 403, statusMessage: 'You can only rate players you shared a class with' })
  }
  if (session.status === 'CANCELLED') {
    throw createError({ statusCode: 403, statusMessage: 'Class was cancelled' })
  }
  if (!classSessionEnded(session.date, session.endTime)) {
    throw createError({ statusCode: 403, statusMessage: 'Class has not finished yet' })
  }
  return session
}

export function parseSkillLevelInput(value: unknown): SkillLevel | null {
  const levels: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO']
  return typeof value === 'string' && levels.includes(value as SkillLevel) ? (value as SkillLevel) : null
}
