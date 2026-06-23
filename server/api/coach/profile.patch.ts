export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const body = await readBody<{
    nameFa?: string
    nameEn?: string
    city?: string
    bioFa?: string
    bioEn?: string
    sportId?: string
    sessionPrice?: number
    photo?: string
  }>(event)

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach profile not found' })

  if (body.sessionPrice !== undefined && (body.sessionPrice < 0 || body.sessionPrice > 50_000_000)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid session price' })
  }

  const nameFa = body.nameFa?.trim()
  const nameEn = body.nameEn?.trim()

  return prisma.$transaction(async (tx) => {
    if (nameFa || nameEn) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          ...(nameFa ? { name: nameFa } : {}),
          ...(nameEn ? { nameEn } : {}),
        },
      })
    }

    return tx.coach.update({
      where: { userId: user.id },
      data: {
        ...(nameFa ? { nameFa } : {}),
        ...(nameEn ? { nameEn } : {}),
        ...(body.city ? { city: body.city } : {}),
        ...(body.bioFa !== undefined ? { bioFa: body.bioFa } : {}),
        ...(body.bioEn !== undefined ? { bioEn: body.bioEn } : {}),
        ...(body.sportId ? { sportId: body.sportId } : {}),
        ...(body.sessionPrice !== undefined ? { sessionPrice: Math.round(body.sessionPrice) } : {}),
        ...(body.photo !== undefined ? { photo: body.photo || null } : {}),
      },
      include: { sport: true },
    })
  })
})
