import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ replyFa?: string; replyEn?: string }>(event)

  const replyFa = body.replyFa?.trim()
  if (!replyFa) throw createError({ statusCode: 400, statusMessage: 'Reply is required' })

  const review = await prisma.review.findUnique({ where: { id } })
  if (!review?.clubId) throw createError({ statusCode: 404, statusMessage: 'Review not found' })
  await requireClubOwner(user.id, review.clubId)

  return prisma.review.update({
    where: { id },
    data: {
      replyFa,
      replyEn: body.replyEn?.trim() || replyFa,
      repliedAt: new Date(),
    },
    include: {
      user: { select: { id: true, name: true, nameEn: true, email: true } },
    },
  })
})
