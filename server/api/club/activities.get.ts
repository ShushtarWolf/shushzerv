export default defineEventHandler(async (event) => {
  const { clubId } = getQuery(event)

  return prisma.clubActivity.findMany({
    where: clubId ? { clubId: String(clubId) } : {},
    include: { club: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })
})
