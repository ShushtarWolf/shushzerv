import type { SkillLevel, UserGender } from '@prisma/client'
import { scoreQuizAnswers } from '#shared/skillQuiz'
import { recalculateAthleteLevel } from '../../utils/skillRating'

const GENDERS: UserGender[] = ['MALE', 'FEMALE']

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{
    sports?: string[]
    gender?: UserGender
    quizAnswers?: Record<string, string>
  }>(event)

  const sports = Array.isArray(body.sports) ? body.sports.filter(Boolean).slice(0, 8) : []
  const favoriteSports = sports.join(',') || null

  if (body.gender && !GENDERS.includes(body.gender)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid gender' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      favoriteSports,
      onboardedAt: new Date(),
      ...(body.gender ? { gender: body.gender } : {}),
    },
  })

  if (user.role === 'ATHLETE' && sports.length) {
    const primarySport = await prisma.sport.findUnique({ where: { slug: sports[0] } })
    if (primarySport) {
      const answers = body.quizAnswers && typeof body.quizAnswers === 'object' ? body.quizAnswers : null
      if (!answers || !Object.keys(answers).length) {
        throw createError({ statusCode: 400, statusMessage: 'Sport quiz answers required for new athletes' })
      }

      const level: SkillLevel = scoreQuizAnswers(answers)

      await prisma.athleteProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, sportId: primarySport.id, level },
        update: { sportId: primarySport.id, level },
      })

      const existingQuiz = await prisma.skillRating.findFirst({
        where: { ratedUserId: user.id, sportId: primarySport.id, source: 'QUIZ' },
      })
      if (!existingQuiz) {
        await prisma.skillRating.create({
          data: {
            ratedUserId: user.id,
            raterId: null,
            sportId: primarySport.id,
            level,
            source: 'QUIZ',
          },
        })
      }

      await recalculateAthleteLevel(user.id, primarySport.id)
    }
  }

  const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  await setUserSession(event, { user: toSessionUser(updated) })

  return { ok: true, favoriteSports: updated.favoriteSports }
})
