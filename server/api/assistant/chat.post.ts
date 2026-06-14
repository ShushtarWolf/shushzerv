export default defineEventHandler(async (event) => {
  const { message, locale } = await readBody<{ message?: string; locale?: string }>(event)
  const text = (message ?? '').trim().toLowerCase()
  const isFa = locale !== 'en'

  if (!text) {
    return {
      reply: isFa
        ? 'سلام! من شوش‌بات هستم. درباره رزرو زمین، کلاس، همبازی، مربی یا برنامه تمرین بپرس.'
        : 'Hi! I\'m ShushBot. Ask about court booking, classes, matches, coaches, or training plans.',
      suggestions: isFa
        ? ['رزرو زمین', 'کلاس گروهی', 'پیدا کردن همبازی', 'برنامه تمرین']
        : ['Book a court', 'Group classes', 'Find players', 'Training plan'],
    }
  }

  const clubs = await prisma.club.findMany({ where: { featured: true }, take: 3, select: { nameFa: true, nameEn: true, slug: true } })
  const coaches = await prisma.coach.findMany({ orderBy: { rating: 'desc' }, take: 3, select: { nameFa: true, nameEn: true } })
  const classCount = await prisma.classSession.count({ where: { status: 'OPEN' } })
  const matchCount = await prisma.openMatch.count({ where: { status: 'OPEN' } })

  const clubList = clubs.map((c) => (isFa ? c.nameFa : c.nameEn)).join('، ')

  if (/رزرو|زمین|book|court|reserve/.test(text)) {
    return {
      reply: isFa
        ? `برای رزرو زمین، باشگاه را انتخاب کن و سانس دلخواه را بزن. باشگاه‌های منتخب: ${clubList}. پرداخت در محل باشگاه انجام می‌شود.`
        : `To book a court, pick a club and choose a slot. Featured clubs: ${clubList}. Pay at the club when you arrive.`,
      link: '/clubs',
    }
  }

  if (/کلاس|class|group/.test(text)) {
    return {
      reply: isFa
        ? `${classCount} کلاس گروهی باز برای ثبت‌نام وجود دارد. از بخش کلاس‌ها می‌توانی ثبت‌نام کنی.`
        : `${classCount} group classes are open for enrollment. Browse the Classes section to sign up.`,
      link: '/classes',
    }
  }

  if (/همبازی|match|player|بازی/.test(text)) {
    return {
      reply: isFa
        ? `${matchCount} بازی باز برای پیوستن هست. سطح خودت را در پروفایل تنظیم کن و در بخش همبازی جستجو کن.`
        : `${matchCount} open matches need players. Set your level in your profile and browse Matches.`,
      link: '/matches',
    }
  }

  if (/مربی|coach/.test(text)) {
    const coachList = coaches.map((c) => (isFa ? c.nameFa : c.nameEn)).join('، ')
    return {
      reply: isFa
        ? `مربیان برتر: ${coachList}. پروفایل هر مربی را ببین و جلسه رزرو کن.`
        : `Top coaches: ${coachList}. View profiles and book a session.`,
      link: '/coaches',
    }
  }

  if (/برنامه|plan|training|تمرین/.test(text)) {
    return {
      reply: isFa
        ? 'مربیان می‌توانند برنامه تمرینی اختصاصی بسازند و به ورزشکاران اختصاص دهند. در داشبورد برنامه‌هایت را ببین.'
        : 'Coaches can create and assign training plans. Check your dashboard for assigned programs.',
      link: '/dashboard',
    }
  }

  if (/سطح|level|رتبه/.test(text)) {
    return {
      reply: isFa
        ? 'سطح مهارت (مبتدی تا حرفه‌ای) در داشبورد ورزشکار قابل تنظیم است و برای پیدا کردن همبازی مناسب استفاده می‌شود.'
        : 'Skill level (beginner to pro) is set in the athlete dashboard and used for matchmaking.',
      link: '/dashboard',
    }
  }

  if (/پرداخت|pay|قیمت|price/.test(text)) {
    return {
      reply: isFa
        ? 'در این نسخه پرداخت آنلاین نداریم — رزرو کن و در باشگاه پرداخت کن.'
        : 'No online payment in this version — book now and pay at the club.',
    }
  }

  return {
    reply: isFa
      ? 'می‌توانم درباره رزرو زمین، کلاس گروهی، همبازی، مربیان و برنامه تمرین کمک کنم. چه کاری می‌خواهی انجام دهی؟'
      : 'I can help with court booking, group classes, open matches, coaches, and training plans. What would you like to do?',
    suggestions: isFa
      ? ['رزرو زمین', 'کلاس‌ها', 'همبازی', 'مربیان']
      : ['Book court', 'Classes', 'Matches', 'Coaches'],
  }
})
