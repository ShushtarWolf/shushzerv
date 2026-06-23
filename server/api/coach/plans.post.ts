import { createNotification } from '../../utils/notifications'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const body = await readBody<{
    titleFa?: string
    titleEn?: string
    bodyFa?: string
    bodyEn?: string
    sport?: string
    athleteEmail?: string
    planType?: 'TRAINING' | 'DIET'
  }>(event)

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach profile not found' })

  if (!body.titleFa || !body.bodyFa) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  let sportId: string | null = coach.sportId
  if (body.sport) {
    const sport = await prisma.sport.findUnique({ where: { slug: body.sport } })
    sportId = sport?.id ?? sportId
  }

  const plan = await prisma.trainingPlan.create({
    data: {
      coachId: coach.id,
      sportId,
      titleFa: body.titleFa,
      titleEn: body.titleEn || body.titleFa,
      bodyFa: body.bodyFa,
      bodyEn: body.bodyEn || body.bodyFa,
      planType: body.planType ?? 'TRAINING',
    },
  })

  if (body.athleteEmail?.trim()) {
    const email = body.athleteEmail.trim().toLowerCase()
    const athlete = await prisma.user.findUnique({ where: { email } })
    if (!athlete || athlete.role !== 'ATHLETE') {
      throw createError({ statusCode: 400, statusMessage: 'Athlete not found' })
    }

    await prisma.planAssignment.create({ data: { planId: plan.id, athleteId: athlete.id } })

    await createNotification(athlete.id, {
      type: 'PLAN',
      titleFa: 'برنامه تمرینی جدید',
      titleEn: 'New training plan',
      bodyFa: `${coach.nameFa} برنامه «${plan.titleFa}» را برای شما ثبت کرد`,
      bodyEn: `${coach.nameEn} assigned you «${plan.titleEn}»`,
      link: '/dashboard?tab=plans',
    })
  }

  return plan
})
