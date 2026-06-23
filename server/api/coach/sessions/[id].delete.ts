import { cancelCoachSession } from '../../../utils/coachSession'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const session = await prisma.coachSession.findUnique({
    where: { id },
    include: {
      coach: { select: { id: true, userId: true, nameFa: true, nameEn: true } },
      athlete: { select: { id: true, name: true, nameEn: true } },
    },
  })
  if (!session) throw createError({ statusCode: 404, statusMessage: 'Session not found' })

  const coachOwner = user.role === 'COACH' && session.coach.userId === user.id
  const isAthlete = session.athleteId === user.id
  if (!coachOwner && !isAthlete) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  await cancelCoachSession(session, coachOwner ? 'coach' : 'athlete')
  return { ok: true }
})
