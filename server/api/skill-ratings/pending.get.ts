import { classSessionEnded } from '../../utils/skillRating'

export type PendingSkillRating = {
  ratedUserId: string
  name: string
  nameEn: string | null
  classSessionId?: string
  coachSessionId?: string
  contextFa: string
  contextEn: string
  date: string
  source: 'COACH' | 'PEER'
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const pending: PendingSkillRating[] = []

  if (user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
    if (coach) {
      const classes = await prisma.classSession.findMany({
        where: {
          coachId: coach.id,
          status: { not: 'CANCELLED' },
        },
        include: {
          enrollments: {
            include: {
              user: { select: { id: true, name: true, nameEn: true } },
            },
          },
        },
      })

      for (const cls of classes) {
        if (!classSessionEnded(cls.date, cls.endTime)) continue
        for (const en of cls.enrollments) {
          const existing = await prisma.skillRating.findFirst({
            where: { raterId: user.id, ratedUserId: en.userId, classSessionId: cls.id },
          })
          if (existing) continue
          pending.push({
            ratedUserId: en.userId,
            name: en.user.name,
            nameEn: en.user.nameEn,
            classSessionId: cls.id,
            contextFa: cls.titleFa,
            contextEn: cls.titleEn,
            date: cls.date,
            source: 'COACH',
          })
        }
      }

      const sessions = await prisma.coachSession.findMany({
        where: {
          coachId: coach.id,
          status: { not: 'CANCELLED' },
        },
        include: {
          athlete: { select: { id: true, name: true, nameEn: true } },
        },
      })

      for (const s of sessions) {
        if (!classSessionEnded(s.date, s.endTime)) continue
        const existing = await prisma.skillRating.findFirst({
          where: { raterId: user.id, ratedUserId: s.athleteId, coachSessionId: s.id },
        })
        if (existing) continue
        pending.push({
          ratedUserId: s.athlete.id,
          name: s.athlete.name,
          nameEn: s.athlete.nameEn,
          coachSessionId: s.id,
          contextFa: `جلسه خصوصی ${s.date}`,
          contextEn: `Private session ${s.date}`,
          date: s.date,
          source: 'COACH',
        })
      }
    }
  }

  if (user.role === 'ATHLETE') {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { userId: user.id },
      include: {
        classSession: {
          include: {
            enrollments: {
              include: {
                user: { select: { id: true, name: true, nameEn: true } },
              },
            },
          },
        },
      },
    })

    for (const mine of enrollments) {
      const cls = mine.classSession
      if (cls.status === 'CANCELLED') continue
      if (!classSessionEnded(cls.date, cls.endTime)) continue

      for (const other of cls.enrollments) {
        if (other.userId === user.id) continue
        const existing = await prisma.skillRating.findFirst({
          where: { raterId: user.id, ratedUserId: other.userId, classSessionId: cls.id },
        })
        if (existing) continue
        pending.push({
          ratedUserId: other.user.id,
          name: other.user.name,
          nameEn: other.user.nameEn,
          classSessionId: cls.id,
          contextFa: cls.titleFa,
          contextEn: cls.titleEn,
          date: cls.date,
          source: 'PEER',
        })
      }
    }
  }

  pending.sort((a, b) => b.date.localeCompare(a.date))
  return pending
})
