export default defineEventHandler(async (event) => {
  const { clubId } = getQuery(event)

  const reviews = await prisma.review.findMany({
    where: clubId ? { clubId: String(clubId) } : {},
    include: {
      user: { select: { id: true, name: true } },
      club: { select: { id: true, nameFa: true, nameEn: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  return reviews
})
