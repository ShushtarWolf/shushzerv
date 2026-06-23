export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const clubId = getQuery(event).clubId as string | undefined

  if (user.role === 'PLATFORM_ADMIN') {
    return { role: 'PLATFORM_ADMIN' as const, ...(await getPlatformChartData()) }
  }

  if (user.role === 'CLUB_ADMIN') {
    return { role: 'CLUB_ADMIN' as const, ...(await getClubChartData(user.id, clubId)) }
  }

  if (user.role === 'COACH') {
    return { role: 'COACH' as const, ...(await getCoachChartData(user.id)) }
  }

  return { role: 'ATHLETE' as const, ...(await getAthleteChartData(user.id)) }
})
