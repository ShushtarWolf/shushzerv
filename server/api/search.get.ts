export type GlobalSearchResult = {
  type: 'club' | 'coach' | 'class' | 'match' | 'tournament' | 'news' | 'sport'
  labelFa: string
  labelEn: string
  subtitleFa?: string
  subtitleEn?: string
  link: string
}

const TAKE = 4

function textFilter(search: string) {
  return { contains: search }
}

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event)
  const search = typeof q === 'string' ? q.trim() : ''
  if (!search) return { results: [] as GlobalSearchResult[] }

  const results: GlobalSearchResult[] = []

  const [clubs, coaches, classes, matches, tournaments, news, sports] = await Promise.all([
    prisma.club.findMany({
      where: {
        OR: [
          { nameFa: textFilter(search) },
          { nameEn: textFilter(search) },
          { city: textFilter(search) },
          { addressFa: textFilter(search) },
          { addressEn: textFilter(search) },
        ],
      },
      take: TAKE,
      orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
    }),
    prisma.coach.findMany({
      where: {
        OR: [
          { nameFa: textFilter(search) },
          { nameEn: textFilter(search) },
          { city: textFilter(search) },
        ],
      },
      include: { sport: true },
      take: TAKE,
      orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
    }),
    prisma.classSession.findMany({
      where: {
        status: { not: 'CANCELLED' },
        OR: [{ titleFa: textFilter(search) }, { titleEn: textFilter(search) }],
      },
      include: { club: true, sport: true },
      take: TAKE,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.openMatch.findMany({
      where: {
        status: 'OPEN',
        OR: [
          { city: textFilter(search) },
          { notesFa: textFilter(search) },
          { notesEn: textFilter(search) },
          { sport: { OR: [{ nameFa: textFilter(search) }, { nameEn: textFilter(search) }] } },
        ],
      },
      include: { sport: true, club: true },
      take: TAKE,
      orderBy: { date: 'asc' },
    }),
    prisma.tournament.findMany({
      where: {
        status: { not: 'CANCELLED' },
        OR: [{ titleFa: textFilter(search) }, { titleEn: textFilter(search) }],
      },
      include: { sport: true, club: true },
      take: TAKE,
      orderBy: { date: 'asc' },
    }),
    prisma.newsArticle.findMany({
      where: {
        OR: [
          { titleFa: textFilter(search) },
          { titleEn: textFilter(search) },
          { excerptFa: textFilter(search) },
          { excerptEn: textFilter(search) },
        ],
      },
      take: TAKE,
      orderBy: { date: 'desc' },
    }),
    prisma.sport.findMany({
      where: {
        OR: [
          { nameFa: textFilter(search) },
          { nameEn: textFilter(search) },
          { slug: textFilter(search) },
        ],
      },
      take: TAKE,
    }),
  ])

  for (const c of clubs) {
    results.push({
      type: 'club',
      labelFa: c.nameFa,
      labelEn: c.nameEn,
      subtitleFa: c.city,
      subtitleEn: c.city,
      link: `/clubs/${c.slug}`,
    })
  }

  for (const c of coaches) {
    results.push({
      type: 'coach',
      labelFa: c.nameFa,
      labelEn: c.nameEn,
      subtitleFa: `${c.sport.nameFa} · ${c.city}`,
      subtitleEn: `${c.sport.nameEn} · ${c.city}`,
      link: `/coaches/${c.id}`,
    })
  }

  for (const c of classes) {
    results.push({
      type: 'class',
      labelFa: c.titleFa,
      labelEn: c.titleEn,
      subtitleFa: `${c.club.nameFa} · ${c.sport.nameFa}`,
      subtitleEn: `${c.club.nameEn} · ${c.sport.nameEn}`,
      link: `/classes/${c.id}`,
    })
  }

  for (const m of matches) {
    const sportFa = m.sport?.nameFa ?? 'بازی'
    const sportEn = m.sport?.nameEn ?? 'Match'
    results.push({
      type: 'match',
      labelFa: `${sportFa} · ${m.city}`,
      labelEn: `${sportEn} · ${m.city}`,
      subtitleFa: `${m.date} ${m.startTime}`,
      subtitleEn: `${m.date} ${m.startTime}`,
      link: `/matches/${m.id}`,
    })
  }

  for (const t of tournaments) {
    results.push({
      type: 'tournament',
      labelFa: t.titleFa,
      labelEn: t.titleEn,
      subtitleFa: t.club?.nameFa ?? t.sport.nameFa,
      subtitleEn: t.club?.nameEn ?? t.sport.nameEn,
      link: `/tournaments/${t.id}`,
    })
  }

  for (const n of news) {
    results.push({
      type: 'news',
      labelFa: n.titleFa,
      labelEn: n.titleEn,
      link: `/news/${n.slug}`,
    })
  }

  for (const s of sports) {
    results.push({
      type: 'sport',
      labelFa: s.nameFa,
      labelEn: s.nameEn,
      link: `/sports/${s.slug}`,
    })
  }

  return { results }
})
