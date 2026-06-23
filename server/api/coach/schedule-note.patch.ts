export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const body = await readBody<{
    type?: 'session' | 'class'
    id?: string
    note?: string
  }>(event)

  if (!body.type || !body.id) {
    throw createError({ statusCode: 400, statusMessage: 'type and id are required' })
  }

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach profile not found' })

  const note = body.note?.trim() ?? ''

  if (body.type === 'session') {
    const session = await prisma.coachSession.findUnique({ where: { id: body.id } })
    if (!session || session.coachId !== coach.id) {
      throw createError({ statusCode: 404, statusMessage: 'Session not found' })
    }
    return prisma.coachSession.update({
      where: { id: body.id },
      data: { coachNote: note || null },
    })
  }

  const cls = await prisma.classSession.findFirst({
    where: { id: body.id, coachId: coach.id },
  })
  if (!cls) throw createError({ statusCode: 404, statusMessage: 'Class not found' })
  return prisma.classSession.update({
    where: { id: body.id },
    data: { coachNote: note || null },
  })
})
