export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { q } = getQuery(event)
  const search = typeof q === 'string' ? q.trim() : ''
  if (!search) return { results: [] }

  const results: Array<{ type: string; label: string; link: string }> = []

  if (user.role === 'ATHLETE') {
    const [clubs, matches] = await Promise.all([
      prisma.club.findMany({
        where: { OR: [{ nameFa: { contains: search } }, { nameEn: { contains: search } }, { city: { contains: search } }] },
        take: 5,
      }),
      prisma.openMatch.findMany({
        where: { city: { contains: search }, status: 'OPEN' },
        include: { sport: true },
        take: 5,
      }),
    ])
    for (const c of clubs) results.push({ type: 'club', label: c.nameFa, link: `/clubs/${c.slug}` })
    for (const m of matches) results.push({ type: 'match', label: `${m.sport?.nameFa ?? 'Match'} · ${m.city}`, link: `/matches/${m.id}` })
  }

  if (user.role === 'CLUB_ADMIN') {
    const clubs = await prisma.club.findMany({ where: { ownerId: user.id }, select: { id: true } })
    const clubIds = clubs.map((c) => c.id)
    const bookings = await prisma.booking.findMany({
      where: {
        slot: { court: { clubId: { in: clubIds } } },
        OR: [{ guestName: { contains: search } }, { user: { name: { contains: search } } }],
      },
      include: { user: true, slot: { include: { court: { include: { club: true } } } } },
      take: 8,
    })
    for (const b of bookings) {
      results.push({
        type: 'booking',
        label: `${b.user?.name ?? b.guestName ?? 'Guest'} · ${b.slot?.court?.club?.nameFa ?? ''}`,
        link: '/dashboard/club?tab=bookings',
      })
    }
  }

  if (user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
    if (!coach) return { results: [] }

    const [plans, assignments, sessions] = await Promise.all([
      prisma.trainingPlan.findMany({
        where: {
          coachId: coach.id,
          OR: [{ titleFa: { contains: search } }, { titleEn: { contains: search } }],
        },
        take: 5,
      }),
      prisma.planAssignment.findMany({
        where: {
          plan: { coachId: coach.id },
          athlete: {
            OR: [
              { name: { contains: search } },
              { nameEn: { contains: search } },
              { email: { contains: search } },
            ],
          },
        },
        include: { athlete: true, plan: true },
        take: 5,
      }),
      prisma.coachSession.findMany({
        where: {
          coachId: coach.id,
          status: { not: 'CANCELLED' },
          OR: [{ date: { contains: search } }, { athlete: { name: { contains: search } } }],
        },
        include: { athlete: { select: { name: true } } },
        take: 5,
      }),
    ])

    for (const p of plans) results.push({ type: 'plan', label: p.titleFa, link: '/dashboard/coach?tab=plans' })
    for (const a of assignments) {
      results.push({
        type: 'student',
        label: `${a.athlete.name} · ${a.plan.titleFa}`,
        link: '/dashboard/coach?tab=students',
      })
    }
    for (const s of sessions) {
      results.push({
        type: 'session',
        label: `${s.athlete?.name ?? 'Session'} · ${s.date} ${s.startTime}`,
        link: '/dashboard/coach?tab=sessions',
      })
    }
  }

  if (user.role === 'PLATFORM_ADMIN') {
    const [users, clubs] = await Promise.all([
      prisma.user.findMany({
        where: { OR: [{ name: { contains: search } }, { email: { contains: search } }] },
        take: 5,
      }),
      prisma.club.findMany({
        where: { OR: [{ nameFa: { contains: search } }, { nameEn: { contains: search } }] },
        take: 5,
      }),
    ])
    for (const u of users) results.push({ type: 'user', label: `${u.name} · ${u.email}`, link: '/dashboard/admin?tab=users' })
    for (const c of clubs) results.push({ type: 'club', label: c.nameFa, link: '/dashboard/admin?tab=clubs' })
  }

  return { results }
})
