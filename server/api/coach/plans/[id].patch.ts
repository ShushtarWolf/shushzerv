import { createNotification } from '../../../utils/notifications'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ titleFa?: string; titleEn?: string; bodyFa?: string; bodyEn?: string; planType?: string; athleteEmail?: string }>(event)

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach not found' })

  const plan = await prisma.trainingPlan.findFirst({ where: { id, coachId: coach.id } })
  if (!plan) throw createError({ statusCode: 404, statusMessage: 'Plan not found' })

  const updated = await prisma.trainingPlan.update({
    where: { id },
    data: {
      ...(body.titleFa ? { titleFa: body.titleFa } : {}),
      ...(body.titleEn ? { titleEn: body.titleEn } : {}),
      ...(body.bodyFa ? { bodyFa: body.bodyFa } : {}),
      ...(body.bodyEn ? { bodyEn: body.bodyEn } : {}),
      ...(body.planType ? { planType: body.planType as 'TRAINING' | 'DIET' } : {}),
    },
  })

  if (body.athleteEmail?.trim()) {
    const email = body.athleteEmail.trim().toLowerCase()
    const athlete = await prisma.user.findUnique({ where: { email } })
    if (!athlete || athlete.role !== 'ATHLETE') {
      throw createError({ statusCode: 400, statusMessage: 'Athlete not found' })
    }

    const existing = await prisma.planAssignment.findUnique({
      where: { planId_athleteId: { planId: id, athleteId: athlete.id } },
    })

    if (!existing) {
      await prisma.planAssignment.create({ data: { planId: id, athleteId: athlete.id } })
      await createNotification(athlete.id, {
        type: 'PLAN',
        titleFa: 'برنامه تمرینی جدید',
        titleEn: 'New training plan',
        bodyFa: `${coach.nameFa} برنامه «${updated.titleFa}» را برای شما ثبت کرد`,
        bodyEn: `${coach.nameEn} assigned you «${updated.titleEn}»`,
        link: '/dashboard?tab=plans',
      })
    }
  }

  return updated
})
