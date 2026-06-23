export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const body = await readBody<{
    bioFa?: string
    bioEn?: string
    sessionPrice?: number
    photo?: string
  }>(event)

  const bioFa = body.bioFa?.trim()
  if (!bioFa) throw createError({ statusCode: 400, statusMessage: 'Bio is required' })

  const sessionPrice = body.sessionPrice !== undefined ? Math.round(body.sessionPrice) : undefined
  if (sessionPrice === undefined || sessionPrice < 0 || sessionPrice > 50_000_000) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid session price' })
  }

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach profile not found' })

  await prisma.$transaction(async (tx) => {
    await tx.coach.update({
      where: { userId: user.id },
      data: {
        bioFa,
        bioEn: body.bioEn?.trim() || bioFa,
        sessionPrice,
        ...(body.photo !== undefined ? { photo: body.photo || null } : {}),
      },
    })
    await tx.user.update({
      where: { id: user.id },
      data: { onboardedAt: new Date() },
    })
  })

  const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  await setUserSession(event, { user: toSessionUser(updated) })

  return { ok: true }
})
