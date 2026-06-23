export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody<{ featured?: boolean }>(event)
  const coach = await prisma.coach.findUnique({ where: { id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach not found' })

  return prisma.coach.update({
    where: { id },
    data: {
      ...(body.featured !== undefined ? { featured: body.featured } : {}),
    },
    include: { sport: true, user: { select: { id: true, email: true, name: true } } },
  })
})
