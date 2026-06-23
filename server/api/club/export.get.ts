import { requireClubOwner } from '../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const { clubId } = getQuery(event)
  if (!clubId) throw createError({ statusCode: 400, statusMessage: 'clubId required' })
  await requireClubOwner(user.id, String(clubId))

  const bookings = await prisma.booking.findMany({
    where: {
      status: { not: 'CANCELLED' },
      slot: { court: { clubId: String(clubId) } },
    },
    include: {
      user: { select: { name: true, email: true } },
      slot: { include: { court: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const header = 'id,date,start,end,court,guest,user,status,payment,price\n'
  const rows = bookings.map((b) =>
    [
      b.id,
      b.slot?.date ?? '',
      b.slot?.startTime ?? '',
      b.slot?.endTime ?? '',
      b.slot?.court?.nameFa ?? '',
      b.guestName ?? '',
      b.user?.name ?? '',
      b.status,
      b.paymentStatus,
      b.slot?.price ?? 0,
    ].join(','),
  )

  setHeader(event, 'Content-Type', 'text/csv')
  setHeader(event, 'Content-Disposition', 'attachment; filename=bookings.csv')
  return header + rows.join('\n')
})
