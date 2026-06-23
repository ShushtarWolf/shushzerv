import type { SkillLevel } from '@prisma/client'

const LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO']

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'ATHLETE')
  const body = await readBody<{
    level?: SkillLevel
    sport?: string
    name?: string
    phone?: string
    locale?: string
    favoriteSports?: string
  }>(event)

  const profile = await prisma.athleteProfile.findUnique({ where: { userId: user.id } })
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  const data: { level?: SkillLevel; sportId?: string } = {}
  if (body.level && LEVELS.includes(body.level)) data.level = body.level
  if (body.sport) {
    const sport = await prisma.sport.findUnique({ where: { slug: body.sport } })
    if (sport) data.sportId = sport.id
  }

  const userData: { name?: string; phone?: string; locale?: string; favoriteSports?: string } = {}
  if (body.name?.trim()) userData.name = body.name.trim()
  if (body.phone !== undefined) userData.phone = body.phone
  if (body.locale === 'fa' || body.locale === 'en') userData.locale = body.locale
  if (body.favoriteSports !== undefined) userData.favoriteSports = body.favoriteSports

  const [updated, updatedUser] = await prisma.$transaction([
    prisma.athleteProfile.update({
      where: { userId: user.id },
      data,
      include: { sport: true },
    }),
    Object.keys(userData).length
      ? prisma.user.update({ where: { id: user.id }, data: userData })
      : prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
  ])

  await setUserSession(event, { user: toSessionUser(updatedUser) })

  return { profile: updated, user: updatedUser }
})
