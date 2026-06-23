export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const { message, locale } = await readBody<{ message?: string; locale?: string }>(event)
  const text = (message ?? '').trim().toLowerCase()
  const isFa = locale !== 'en'

  const topSuggestions = isFa
    ? ['رزرو زمین', 'همبازی', 'مسابقات', 'مربیان', 'کیف پول', 'داشبورد']
    : ['Book a court', 'Find matches', 'Tournaments', 'Coaches', 'Wallet balance', 'Dashboard']

  if (!text) {
    return {
      reply: isFa
        ? 'سلام! من راهنمای هوشمند شوش‌زرو هستم — نسخه آزمایشی با پاسخ‌های از پیش تعریف‌شده.'
        : 'Hi! I\'m the Shushzerv smart guide — a beta with rule-based answers.',
      suggestions: topSuggestions,
    }
  }

  if (/wallet|balance|credit|موجودی|کیف پول/.test(text)) {
    if (!session?.user) {
      return {
        reply: isFa
          ? 'برای دیدن موجودی کیف پول باید وارد حساب شوی.'
          : 'Sign in to see your wallet balance.',
        link: '/login',
      }
    }
    const wallet = await getUserWalletSummary(session.user.id)
    return {
      reply: isFa
        ? `موجودی کیف پول شما: ${wallet.balance.toLocaleString(isFa ? 'fa-IR' : 'en-US')} تومان.`
        : `Your wallet balance: ${wallet.balance.toLocaleString('en-US')} Toman.`,
      link: '/dashboard?tab=wallet',
    }
  }

  if (/my booking|bookings|رزروهای من|رزرو من/.test(text)) {
    if (!session?.user) {
      return {
        reply: isFa ? 'برای دیدن رزروها باید وارد حساب شوی.' : 'Sign in to see your bookings.',
        link: '/login',
      }
    }
    const count = await prisma.booking.count({
      where: { userId: session.user.id, status: { not: 'CANCELLED' } },
    })
    return {
      reply: isFa
        ? `شما ${count} رزرو فعال دارید. جزئیات در داشبورد > رزروها.`
        : `You have ${count} active booking${count === 1 ? '' : 's'}. See Dashboard > Bookings.`,
      link: '/dashboard?tab=bookings',
    }
  }

  if (/contact|support|email|تماس|پشتیبانی|ایمیل/.test(text)) {
    return {
      reply: isFa
        ? 'برای تماس با ما به صفحه درباره ما برو یا ایمیل hello@shushzerv.app بزن.'
        : 'Visit the About page or email hello@shushzerv.app to reach us.',
      link: '/about',
    }
  }

  if (session?.user && /schedule|برنامه من|calendar|تقویم/.test(text)) {
    const [bookings, enrollments, matches] = await Promise.all([
      prisma.booking.count({ where: { userId: session.user.id, status: { not: 'CANCELLED' } } }),
      prisma.classEnrollment.count({ where: { userId: session.user.id } }),
      prisma.matchParticipant.count({ where: { userId: session.user.id } }),
    ])
    return {
      reply: isFa
        ? `برنامه شما: ${bookings} رزرو زمین، ${enrollments} کلاس، ${matches} بازی. جزئیات در داشبورد > برنامه.`
        : `Your schedule: ${bookings} court bookings, ${enrollments} classes, ${matches} matches. See Dashboard > Schedule.`,
      link: '/dashboard?tab=schedule',
    }
  }

  if (/book tennis|book padel|رزرو تنیس|رزرو پدل|book.*tomorrow|فردا|book sport|رزرو ورزش/.test(text)) {
    const sportSlug = /padel|پدل/.test(text) ? 'padel' : 'tennis'
    const clubs = await prisma.club.findMany({
      where: { courts: { some: { sport: { slug: sportSlug } } } },
      take: 3,
    })
    const names = clubs.map((c) => (isFa ? c.nameFa : c.nameEn)).join(', ')
    return {
      reply: isFa
        ? `باشگاه‌های ${sportSlug} برای رزرو: ${names}. یک باشگاه انتخاب کن و سانس بگیر.`
        : `${sportSlug} clubs ready to book: ${names}. Pick a club and choose a slot.`,
      link: `/clubs?sport=${sportSlug}&book=1`,
    }
  }

  if (/match.*near|همبازی.*نزدیک|find match|همبازی/.test(text)) {
    const open = await prisma.openMatch.count({ where: { status: 'OPEN' } })
    return {
      reply: isFa
        ? `${open} بازی باز برای پیوستن. سطح خودت را در پروفایل تنظیم کن.`
        : `${open} open matches need players. Set your skill level in your profile.`,
      link: '/matches',
    }
  }

  const clubs = await prisma.club.findMany({ where: { featured: true }, take: 3, select: { nameFa: true, nameEn: true, slug: true } })
  const coaches = await prisma.coach.findMany({ orderBy: { rating: 'desc' }, take: 3, select: { nameFa: true, nameEn: true } })
  const classCount = await prisma.classSession.count({ where: { status: 'OPEN' } })
  const matchCount = await prisma.openMatch.count({ where: { status: 'OPEN' } })

  const clubList = clubs.map((c) => (isFa ? c.nameFa : c.nameEn)).join(isFa ? '، ' : ', ')

  if (/رزرو|زمین|book|court|reserve/.test(text)) {
    return {
      reply: isFa
        ? `برای رزرو زمین، باشگاه را انتخاب کن و سانس دلخواه را بزن. باشگاه‌های منتخب: ${clubList}.`
        : `To book a court, pick a club and choose a slot. Featured clubs: ${clubList}.`,
      link: '/clubs?book=1',
    }
  }

  if (/کلاس|class|group/.test(text)) {
    return {
      reply: isFa
        ? `${classCount} کلاس گروهی باز برای ثبت‌نام وجود دارد.`
        : `${classCount} group classes are open for enrollment.`,
      link: '/classes',
    }
  }

  if (/match|player|بازی/.test(text)) {
    return {
      reply: isFa
        ? `${matchCount} بازی باز برای پیوستن هست.`
        : `${matchCount} open matches need players.`,
      link: '/matches',
    }
  }

  if (/مربی|coach/.test(text)) {
    const coachList = coaches.map((c) => (isFa ? c.nameFa : c.nameEn)).join(isFa ? '، ' : ', ')
    return {
      reply: isFa ? `مربیان برتر: ${coachList}.` : `Top coaches: ${coachList}.`,
      link: '/coaches',
    }
  }

  if (/tournament|مسابقه|مسابقات/.test(text)) {
    const open = await prisma.tournament.count({ where: { status: 'OPEN' } })
    return {
      reply: isFa
        ? `${open} مسابقه باز برای ثبت‌نام وجود دارد.`
        : `${open} tournaments are open for registration.`,
      link: '/tournaments',
    }
  }

  if (/dashboard|داشبورد/.test(text)) {
    return {
      reply: isFa
        ? 'داشبورد ورزشکار: رزروها، کلاس‌ها، برنامه، کیف پول و پروفایل.'
        : 'Athlete dashboard: bookings, classes, schedule, wallet, and profile.',
      link: '/dashboard',
    }
  }

  if (/plan|training|تمرین/.test(text)) {
    return {
      reply: isFa ? 'برنامه‌های تمرینی در داشبورد > برنامه‌ها.' : 'Training plans in Dashboard > Plans.',
      link: '/dashboard?tab=plans',
    }
  }

  return {
    reply: isFa
      ? 'می‌توانم درباره رزرو زمین، همبازی، کیف پول، رزروهای من و تماس کمک کنم.'
      : 'I can help with court booking, matches, wallet balance, my bookings, and contact.',
    suggestions: topSuggestions,
  }
})
