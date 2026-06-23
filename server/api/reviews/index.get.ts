export default defineEventHandler(async (event) => {
  const { clubId, coachId } = getQuery(event)

  const reviews = await prisma.review.findMany({
    where: {
      ...(clubId ? { clubId: String(clubId) } : {}),
      ...(coachId ? { coachId: String(coachId) } : {}),
    },
    include: {
      user: { select: { id: true, name: true, nameEn: true } },
      club: { select: { id: true, nameFa: true, nameEn: true, slug: true } },
      coach: { select: { id: true, nameFa: true, nameEn: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  return reviews
})
