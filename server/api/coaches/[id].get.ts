export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const coach = await prisma.coach.findUnique({
    where: { id },
    include: { sport: true },
  })
  if (!coach) {
    throw createError({ statusCode: 404, statusMessage: 'Coach not found' })
  }
  return coach
})
