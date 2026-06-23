export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{
    clubId?: string
    coachId?: string
    rating?: number
    bodyFa?: string
    bodyEn?: string
  }>(event)

  const hasClub = !!body.clubId
  const hasCoach = !!body.coachId
  if ((!hasClub && !hasCoach) || (hasClub && hasCoach) || !body.rating || body.rating < 1 || body.rating > 5) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid review data' })
  }

  if (hasClub) {
    const club = await prisma.club.findUnique({ where: { id: body.clubId } })
    if (!club) throw createError({ statusCode: 404, statusMessage: 'Club not found' })

    const existing = await prisma.review.findFirst({
      where: { userId: user.id, clubId: body.clubId },
    })
    if (existing) throw createError({ statusCode: 409, statusMessage: 'Review already exists' })

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        clubId: body.clubId,
        rating: body.rating,
        bodyFa: body.bodyFa ?? '',
        bodyEn: body.bodyEn ?? body.bodyFa ?? '',
      },
      include: { user: { select: { id: true, name: true, nameEn: true } }, club: true },
    })

    const avg = await prisma.review.aggregate({
      where: { clubId: body.clubId },
      _avg: { rating: true },
    })
    await prisma.club.update({
      where: { id: body.clubId },
      data: { rating: avg._avg.rating ?? club.rating },
    })

    return review
  }

  const coach = await prisma.coach.findUnique({ where: { id: body.coachId } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach not found' })

  const hadSession = await prisma.coachSession.findFirst({
    where: {
      coachId: coach.id,
      athleteId: user.id,
      status: { not: 'CANCELLED' },
    },
  })
  if (!hadSession) {
    throw createError({ statusCode: 403, statusMessage: 'You can only review coaches you have booked' })
  }

  const existing = await prisma.review.findFirst({
    where: { userId: user.id, coachId: body.coachId },
  })
  if (existing) throw createError({ statusCode: 409, statusMessage: 'Review already exists' })

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      coachId: body.coachId,
      rating: body.rating,
      bodyFa: body.bodyFa ?? '',
      bodyEn: body.bodyEn ?? body.bodyFa ?? '',
    },
    include: {
      user: { select: { id: true, name: true, nameEn: true } },
      coach: { select: { id: true, nameFa: true, nameEn: true } },
    },
  })

  const avg = await prisma.review.aggregate({
    where: { coachId: body.coachId },
    _avg: { rating: true },
  })
  await prisma.coach.update({
    where: { id: body.coachId },
    data: { rating: avg._avg.rating ?? coach.rating },
  })

  return review
})
