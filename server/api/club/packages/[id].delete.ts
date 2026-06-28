import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const existing = await prisma.classPackage.findUnique({ where: { id } })
  if (!existing?.clubId) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  await requireClubOwner(user.id, existing.clubId)
  await prisma.classPackage.delete({ where: { id } })
  return { ok: true }
})
