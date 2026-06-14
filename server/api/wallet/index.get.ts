export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  if (user.role === 'CLUB_ADMIN') {
    const clubs = await prisma.club.findMany({
      where: { ownerId: user.id },
      include: { wallet: true },
    })
    const clubWallets = await Promise.all(
      clubs.map(async (club) => {
        const summary = await getClubWalletSummary(club.id)
        return { clubId: club.id, clubNameFa: club.nameFa, clubNameEn: club.nameEn, ...summary }
      }),
    )
    const totalBalance = clubWallets.reduce((sum, w) => sum + w.balance, 0)
    return { kind: 'club' as const, totalBalance, clubWallets }
  }

  const summary = await getUserWalletSummary(user.id)
  return { kind: 'user' as const, ...summary }
})
