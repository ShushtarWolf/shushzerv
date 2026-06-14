import type { SkillLevel } from '@prisma/client'

const LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO']

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'ATHLETE')
  const body = await readBody<{
    sport?: string
    city?: string
    clubId?: string
    date?: string
    startTime?: string
    maxPlayers?: number
    minLevel?: SkillLevel
    maxLevel?: SkillLevel
    notesFa?: string
    notesEn?: string
  }>(event)

  if (!body.sport || !body.city || !body.date || !body.startTime) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const sport = await prisma.sport.findUnique({ where: { slug: body.sport } })
  if (!sport) throw createError({ statusCode: 400, statusMessage: 'Invalid sport' })

  const minLevel = LEVELS.includes(body.minLevel!) ? body.minLevel! : 'BEGINNER'
  const maxLevel = LEVELS.includes(body.maxLevel!) ? body.maxLevel! : 'PRO'

  const shareToken = `${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`

  const match = await prisma.$transaction(async (tx) => {
    const created = await tx.openMatch.create({
      data: {
        sportId: sport.id,
        city: body.city!,
        clubId: body.clubId || null,
        creatorId: user.id,
        date: body.date!,
        startTime: body.startTime!,
        maxPlayers: body.maxPlayers ?? 4,
        joinedCount: 1,
        minLevel,
        maxLevel,
        notesFa: body.notesFa?.trim() || null,
        notesEn: body.notesEn?.trim() || null,
        shareToken,
      },
    })
    await tx.matchParticipant.create({ data: { matchId: created.id, userId: user.id } })

    const conversation = await tx.conversation.create({
      data: {
        isGroup: true,
        matchId: created.id,
        titleFa: `بازی ${body.city}`,
        titleEn: `Match in ${body.city}`,
        members: { create: { userId: user.id } },
      },
    })
    return { ...created, conversationId: conversation.id }
  })

  await awardXp(user.id, 'createMatch')

  return match
})
