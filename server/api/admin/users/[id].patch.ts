export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'PLATFORM_ADMIN')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ role?: string; suspended?: boolean; name?: string }>(event)

  const data: Record<string, unknown> = {}
  if (body.role) data.role = body.role
  if (body.name?.trim()) data.name = body.name.trim()
  if (body.suspended !== undefined) data.suspendedAt = body.suspended ? new Date() : null

  return prisma.user.update({ where: { id }, data, include: { wallet: true } })
})
