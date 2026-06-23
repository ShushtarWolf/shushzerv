import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!

  const addon = await prisma.courtAddon.findUnique({ where: { id } })
  if (!addon) throw createError({ statusCode: 404, statusMessage: 'Addon not found' })

  await requireClubOwner(user.id, addon.clubId)

  await prisma.courtAddon.delete({ where: { id } })
  return { ok: true }
})
