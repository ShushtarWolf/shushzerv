export default defineEventHandler(async () => {
  return prisma.sport.findMany({ orderBy: { nameEn: 'asc' } })
})
