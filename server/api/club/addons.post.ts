import { requireClubOwner } from '../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    clubId?: string
    nameFa?: string
    nameEn?: string
    price?: number
    courtId?: string
    mode?: 'PROVIDED' | 'RENTAL'
    stock?: number | null
    maxPerBooking?: number
  }>(event)

  if (!body.clubId || !body.nameFa) throw createError({ statusCode: 400, statusMessage: 'Missing fields' })
  await requireClubOwner(user.id, body.clubId)

  const mode = body.mode ?? (body.price && body.price > 0 ? 'RENTAL' : 'PROVIDED')

  return prisma.courtAddon.create({
    data: {
      clubId: body.clubId,
      courtId: body.courtId || null,
      nameFa: body.nameFa,
      nameEn: body.nameEn ?? body.nameFa,
      price: mode === 'PROVIDED' ? 0 : Math.max(0, Math.round(body.price ?? 0)),
      mode,
      stock: body.stock != null && body.stock >= 0 ? Math.round(body.stock) : null,
      maxPerBooking: body.maxPerBooking && body.maxPerBooking >= 1 ? Math.round(body.maxPerBooking) : 4,
    },
  })
})
