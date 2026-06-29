export default defineEventHandler(async (event) => {
  await requireRole(event, 'CLUB_ADMIN')
  const phone = getQuery(event).phone?.toString().trim()
  if (!phone) {
    throw createError({ statusCode: 400, statusMessage: 'phone is required' })
  }

  const athlete = await lookupClubAthleteByPhone(phone)
  if (!athlete) return { found: false as const }
  return { found: true as const, athlete }
})
