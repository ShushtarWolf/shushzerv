import { mapPackage, packageInclude } from '../../../utils/classPackage'
import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const { clubId } = getQuery(event)
  if (!clubId) return []

  await requireClubOwner(user.id, String(clubId))

  const packages = await prisma.classPackage.findMany({
    where: { clubId: String(clubId) },
    include: packageInclude,
    orderBy: { createdAt: 'desc' },
  })

  return packages.map(mapPackage)
})
