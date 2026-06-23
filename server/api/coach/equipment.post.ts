export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const body = await readBody<{
    nameFa?: string
    nameEn?: string
    price?: number
    mode?: 'PROVIDED' | 'RENTAL'
    stock?: number | null
    maxPerBooking?: number
  }>(event)

  if (!body.nameFa?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing fields' })

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach profile not found' })

  const mode = body.mode ?? (body.price && body.price > 0 ? 'RENTAL' : 'PROVIDED')

  return prisma.coachEquipment.create({
    data: {
      coachId: coach.id,
      nameFa: body.nameFa.trim(),
      nameEn: (body.nameEn?.trim() || body.nameFa).trim(),
      price: mode === 'PROVIDED' ? 0 : Math.max(0, Math.round(body.price ?? 0)),
      mode,
      stock: body.stock != null && body.stock >= 0 ? Math.round(body.stock) : null,
      maxPerBooking: body.maxPerBooking && body.maxPerBooking >= 1 ? Math.round(body.maxPerBooking) : 4,
    },
  })
})
