import type { SkillLevel } from '@prisma/client'

const LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO']

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'ATHLETE')
  const body = await readBody<{ level?: SkillLevel; sport?: string }>(event)

  const profile = await prisma.athleteProfile.findUnique({ where: { userId: user.id } })
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  const data: { level?: SkillLevel; sportId?: string } = {}
  if (body.level && LEVELS.includes(body.level)) data.level = body.level
  if (body.sport) {
    const sport = await prisma.sport.findUnique({ where: { slug: body.sport } })
    if (sport) data.sportId = sport.id
  }

  const updated = await prisma.athleteProfile.update({
    where: { userId: user.id },
    data,
    include: { sport: true },
  })

  return updated
})
