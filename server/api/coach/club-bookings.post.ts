import { createNotification } from '../../utils/notifications'
import {
  assertCoachAvailableForSlots,
  notifyCoachOfClubSession,
} from '../../utils/clubBooking'
import {
  assertCoachSessionSlotFree,
  claimSlotForCoachSession,
  loadAvailableSlot,
} from '../../utils/coachClubBooking'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const body = await readBody<{
    slotId?: string
    athleteId?: string
    payAtClub?: boolean
  }>(event)

  const slotId = body.slotId?.trim()
  const athleteId = body.athleteId?.trim()

  if (!slotId || !athleteId) {
    throw createError({ statusCode: 400, statusMessage: 'slotId and athleteId are required' })
  }

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) {
    throw createError({ statusCode: 404, statusMessage: 'Coach profile not found' })
  }

  const assignment = await prisma.planAssignment.findFirst({
    where: {
      athleteId,
      plan: { coachId: coach.id },
    },
  })
  if (!assignment) {
    throw createError({ statusCode: 403, statusMessage: 'Athlete is not your student' })
  }

  const slot = await loadAvailableSlot(slotId)
  await assertCoachAvailableForSlots(coach.id, [slot])
  await assertCoachSessionSlotFree(coach.id, slot)

  const sessionPrice = coach.sessionPrice

  const result = await prisma.$transaction(async (tx) => {
    return claimSlotForCoachSession(tx, {
      slotId,
      athleteId,
      coachId: coach.id,
      payWithWallet: false,
      sessionPrice,
      equipmentTotal: 0,
      coachUserId: coach.userId,
      bookingSource: 'CLUB',
    })
  })

  await notifyCoachOfClubSession({
    coach: { userId: coach.userId, nameFa: coach.nameFa, nameEn: coach.nameEn },
    athlete: result.session.athlete,
    date: result.session.date,
    startTime: result.session.startTime,
  })

  const athlete = await prisma.user.findUnique({ where: { id: athleteId }, select: { id: true } })
  if (athlete) {
    await createNotification(athlete.id, {
      type: 'BOOKING',
      titleFa: 'جلسه در باشگاه رزرو شد',
      titleEn: 'Club session booked',
      bodyFa: `مربی شما جلسه‌ای در ${result.slot.court.club.nameFa} رزرو کرد`,
      bodyEn: `Your coach booked a session at ${result.slot.court.club.nameEn}`,
      link: '/dashboard?tab=bookings',
    })
  }

  return result
})
