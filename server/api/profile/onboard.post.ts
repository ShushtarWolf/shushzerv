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

  if (user.role === 'ATHLETE') {
    const profile = await prisma.athleteProfile.findUnique({ where: { userId: user.id } })
    if (profile) {
      const data: { level?: SkillLevel; sportId?: string } = {}
      if (body.level && LEVELS.includes(body.level)) data.level = body.level
      if (sports[0]) {
        const sport = await prisma.sport.findUnique({ where: { slug: sports[0] } })
        if (sport) data.sportId = sport.id
      }
      if (Object.keys(data).length) {
        await prisma.athleteProfile.update({ where: { userId: user.id }, data })
      }
    }
  }

  const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  await setUserSession(event, { user: toSessionUser(updated) })

  return { ok: true }
})
