import type { SkillLevel } from '@prisma/client'

const LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO']

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ sports?: string[]; level?: SkillLevel }>(event)

  const sports = Array.isArray(body.sports) ? body.sports.filter(Boolean).slice(0, 8) : []
  const favoriteSports = sports.join(',') || null

  await prisma.user.update({
    where: { id: user.id },
    data: { favoriteSports, onboardedAt: new Date() },
  })

  if (user.role === 'ATHLETE' && sports.length) {
    const level = body.level && LEVELS.includes(body.level) ? body.level : 'BEGINNER'
    const primarySport = await prisma.sport.findUnique({ where: { slug: sports[0] } })
    if (primarySport) {
      await prisma.athleteProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, sportId: primarySport.id, level },
        update: { sportId: primarySport.id, ...(body.level && LEVELS.includes(body.level) ? { level: body.level } : {}) },
      })
    }
  }

  const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  await setUserSession(event, { user: toSessionUser(updated) })

  return { ok: true, favoriteSports: updated.favoriteSports }
})
