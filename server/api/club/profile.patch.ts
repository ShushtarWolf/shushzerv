import { requireClubOwner } from '../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<{
    clubId?: string
    nameFa?: string
    nameEn?: string
    addressFa?: string
    addressEn?: string
    city?: string
    district?: string
    lat?: number | null
    lng?: number | null
    priceFrom?: number
    discount?: number | null
    image?: string | null
  }>(event)

  if (!body.clubId) {
    throw createError({ statusCode: 400, statusMessage: 'clubId is required' })
  }

  await requireClubOwner(user.id, body.clubId)

  if (body.priceFrom !== undefined && (body.priceFrom < 0 || body.priceFrom > 50_000_000)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid price' })
  }

  if (body.discount !== undefined && body.discount !== null && (body.discount < 0 || body.discount > 100)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid discount' })
  }

  const nameFa = body.nameFa?.trim()
  const nameEn = body.nameEn?.trim()
  const addressFa = body.addressFa?.trim()
  const addressEn = body.addressEn?.trim()
  const city = body.city?.trim()
  const district = body.district?.trim()

  return prisma.club.update({
    where: { id: body.clubId },
    data: {
      ...(nameFa ? { nameFa } : {}),
      ...(nameEn ? { nameEn } : {}),
      ...(addressFa ? { addressFa } : {}),
      ...(addressEn ? { addressEn } : {}),
      ...(city ? { city } : {}),
      ...(district !== undefined ? { district: district || null } : {}),
      ...(body.lat !== undefined ? { lat: body.lat } : {}),
      ...(body.lng !== undefined ? { lng: body.lng } : {}),
      ...(body.priceFrom !== undefined ? { priceFrom: Math.round(body.priceFrom) } : {}),
      ...(body.discount !== undefined ? { discount: body.discount } : {}),
      ...(body.image !== undefined ? { image: body.image || null } : {}),
    },
    include: { courts: { include: { sport: true } } },
  })
})
