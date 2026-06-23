export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ featured?: boolean; discount?: number; nameFa?: string; nameEn?: string }>(event)

  return prisma.club.update({
    where: { id },
    data: {
      ...(body.featured !== undefined ? { featured: body.featured } : {}),
      ...(body.discount !== undefined ? { discount: body.discount } : {}),
      ...(body.nameFa ? { nameFa: body.nameFa } : {}),
      ...(body.nameEn ? { nameEn: body.nameEn } : {}),
    },
    include: { owner: true, wallet: true },
  })
})
