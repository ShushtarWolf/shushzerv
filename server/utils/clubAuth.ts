export async function requireClubOwner(ownerId: string, clubId: string) {
  const club = await prisma.club.findFirst({ where: { id: clubId, ownerId } })
  if (!club) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  return club
}
