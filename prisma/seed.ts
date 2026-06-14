import { PrismaClient } from '@prisma/client'
import { hashSecret } from '../server/utils/password.ts'

const prisma = new PrismaClient()

const TIME_SLOTS: Array<[string, string]> = [
  ['08:00', '09:30'],
  ['10:00', '11:30'],
  ['16:00', '17:30'],
  ['18:00', '19:30'],
  ['20:00', '21:30'],
]

function isoDate(offsetDays: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const sportsData = [
  { slug: 'tennis', nameFa: 'تنیس', nameEn: 'Tennis', icon: 'tennis', color: '#B8C93E', group: 'racket' },
  { slug: 'padel', nameFa: 'پدل', nameEn: 'Padel', icon: 'padel', color: '#1D6FD4', group: 'racket' },
  { slug: 'football', nameFa: 'فوتبال', nameEn: 'Football', icon: 'football', color: '#000000', group: 'ball' },
  { slug: 'fitness', nameFa: 'بدنسازی', nameEn: 'Fitness', icon: 'fitness', color: '#DC3C3C', group: 'fitness' },
  { slug: 'yoga', nameFa: 'یوگا', nameEn: 'Yoga', icon: 'yoga', color: '#8A7AAF', group: 'fitness' },
  { slug: 'swim', nameFa: 'شنا', nameEn: 'Swimming', icon: 'swim', color: '#0077BE', group: 'water' },
  { slug: 'basketball', nameFa: 'بسکتبال', nameEn: 'Basketball', icon: 'basketball', color: '#FF6B00', group: 'ball' },
  { slug: 'boxing', nameFa: 'بوکس', nameEn: 'Boxing', icon: 'boxing', color: '#9E1B28', group: 'combat' },
]

const cities = ['تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز']
const citiesEn: Record<string, string> = { 'تهران': 'Tehran', 'اصفهان': 'Isfahan', 'شیراز': 'Shiraz', 'مشهد': 'Mashhad', 'تبریز': 'Tabriz' }
const districtsEn: Record<string, string> = {
  'سعادت‌آباد': 'Saadat Abad',
  'الهیه': 'Elahieh',
  'معالی‌آباد': 'Maali Abad',
  'ونک': 'Vanak',
  'سپاهان‌شهر': 'Sepahan Shahr',
  'پاسداران': 'Pasdaran',
  'احمدآباد': 'Ahmad Abad',
  'ولیعصر': 'Valiasr',
  'جردن': 'Jordan',
  'چهارباغ': 'Chahar Bagh',
  'فرشته': 'Fereshteh',
  'قصردشت': 'Qasr Dasht',
  'نیاوران': 'Niavaran',
  'وکیل‌آباد': 'Vakil Abad',
  'تهرانپارس': 'Tehran Pars',
  'یوسف‌آباد': 'Yousef Abad',
}

/** Approximate coordinates for map pins (demo data). */
const cityCoords: Record<string, [number, number]> = {
  'تهران': [35.6892, 51.389],
  'اصفهان': [32.6546, 51.668],
  'شیراز': [29.5918, 52.5837],
  'مشهد': [36.2605, 59.6168],
  'تبریز': [38.08, 46.2919],
}

const tehranDistrictCoords: Record<string, [number, number]> = {
  'سعادت‌آباد': [35.773, 51.363],
  'الهیه': [35.789, 51.424],
  'ونک': [35.757, 51.41],
  'پاسداران': [35.768, 51.477],
  'جردن': [35.754, 51.418],
  'فرشته': [35.798, 51.42],
  'نیاوران': [35.817, 51.47],
  'تهرانپارس': [35.734, 51.533],
  'یوسف‌آباد': [35.732, 51.376],
}

function clubCoords(city: string, district: string, index: number): [number, number] {
  if (city === 'تهران' && tehranDistrictCoords[district]) {
    const [lat, lng] = tehranDistrictCoords[district]
    return [lat + (index % 3) * 0.004, lng + (index % 2) * 0.005]
  }
  const [lat, lng] = cityCoords[city] ?? [35.6892, 51.389]
  return [lat + index * 0.012, lng + index * 0.01]
}

const clubSeeds = [
  { slug: 'azadi-tennis', nameFa: 'مجموعه تنیس آزادی', nameEn: 'Azadi Tennis Complex', sport: 'tennis', city: 'تهران', district: 'سعادت‌آباد', rating: 4.8, priceFrom: 250000, discount: 15, featured: true },
  { slug: 'enghelab-tennis', nameFa: 'باشگاه تنیس انقلاب', nameEn: 'Enghelab Tennis Club', sport: 'tennis', city: 'تهران', district: 'الهیه', rating: 4.6, priceFrom: 300000, featured: true },
  { slug: 'shiraz-tennis-academy', nameFa: 'آکادمی تنیس شیراز', nameEn: 'Shiraz Tennis Academy', sport: 'tennis', city: 'شیراز', district: 'معالی‌آباد', rating: 4.5, priceFrom: 180000 },
  { slug: 'padel-zone-tehran', nameFa: 'پدل زون تهران', nameEn: 'Padel Zone Tehran', sport: 'padel', city: 'تهران', district: 'ونک', rating: 4.7, priceFrom: 320000, discount: 10, featured: true },
  { slug: 'isfahan-padel-club', nameFa: 'باشگاه پدل اصفهان', nameEn: 'Isfahan Padel Club', sport: 'padel', city: 'اصفهان', district: 'سپاهان‌شهر', rating: 4.4, priceFrom: 220000 },
  { slug: 'green-turf-arena', nameFa: 'مجموعه چمن سبز', nameEn: 'Green Turf Arena', sport: 'football', city: 'تهران', district: 'پاسداران', rating: 4.5, priceFrom: 600000, featured: true },
  { slug: 'mashhad-football-center', nameFa: 'مرکز فوتبال مشهد', nameEn: 'Mashhad Football Center', sport: 'football', city: 'مشهد', district: 'احمدآباد', rating: 4.3, priceFrom: 500000 },
  { slug: 'tabriz-mini-football', nameFa: 'مینی فوتبال تبریز', nameEn: 'Tabriz Mini Football', sport: 'football', city: 'تبریز', district: 'ولیعصر', rating: 4.2, priceFrom: 450000 },
  { slug: 'iron-house-gym', nameFa: 'باشگاه آیرون هاوس', nameEn: 'Iron House Gym', sport: 'fitness', city: 'تهران', district: 'جردن', rating: 4.7, priceFrom: 150000, discount: 20, featured: true },
  { slug: 'isfahan-fit-club', nameFa: 'باشگاه فیت اصفهان', nameEn: 'Isfahan Fit Club', sport: 'fitness', city: 'اصفهان', district: 'چهارباغ', rating: 4.4, priceFrom: 120000 },
  { slug: 'zen-yoga-studio', nameFa: 'استودیو یوگا ذن', nameEn: 'Zen Yoga Studio', sport: 'yoga', city: 'تهران', district: 'فرشته', rating: 4.9, priceFrom: 200000, featured: true },
  { slug: 'shiraz-yoga-house', nameFa: 'خانه یوگا شیراز', nameEn: 'Shiraz Yoga House', sport: 'yoga', city: 'شیراز', district: 'قصردشت', rating: 4.6, priceFrom: 160000 },
  { slug: 'aqua-swim-center', nameFa: 'مرکز شنا آکوا', nameEn: 'Aqua Swim Center', sport: 'swim', city: 'تهران', district: 'نیاوران', rating: 4.5, priceFrom: 180000, discount: 12 },
  { slug: 'mashhad-aquatics', nameFa: 'مجموعه آبی مشهد', nameEn: 'Mashhad Aquatics', sport: 'swim', city: 'مشهد', district: 'وکیل‌آباد', rating: 4.3, priceFrom: 150000 },
  { slug: 'hoops-basketball-arena', nameFa: 'سالن بسکتبال هوپس', nameEn: 'Hoops Basketball Arena', sport: 'basketball', city: 'تهران', district: 'تهرانپارس', rating: 4.4, priceFrom: 280000 },
  { slug: 'knockout-boxing-club', nameFa: 'باشگاه بوکس ناک‌اوت', nameEn: 'Knockout Boxing Club', sport: 'boxing', city: 'تهران', district: 'یوسف‌آباد', rating: 4.6, priceFrom: 170000, discount: 10 },
]

const coachSeeds = [
  { nameFa: 'سارا محمدی', nameEn: 'Sara Mohammadi', sport: 'tennis', city: 'تهران', rating: 4.9, sessions: 320, bioFa: 'مربی تنیس با ۱۰ سال سابقه و قهرمان ملی.', bioEn: 'Tennis coach with 10 years of experience and national champion.' },
  { nameFa: 'رضا کریمی', nameEn: 'Reza Karimi', sport: 'tennis', city: 'شیراز', rating: 4.7, sessions: 210, bioFa: 'تمرکز بر آموزش کودکان و نوجوانان.', bioEn: 'Focused on coaching kids and teenagers.' },
  { nameFa: 'مریم احمدی', nameEn: 'Maryam Ahmadi', sport: 'padel', city: 'تهران', rating: 4.8, sessions: 180, bioFa: 'مربی رسمی فدراسیون پدل.', bioEn: 'Official padel federation coach.' },
  { nameFa: 'علی رضایی', nameEn: 'Ali Rezaei', sport: 'football', city: 'تهران', rating: 4.6, sessions: 260, bioFa: 'مربی فوتبال پایه و تکنیک فردی.', bioEn: 'Youth football and individual technique coach.' },
  { nameFa: 'نگار حسینی', nameEn: 'Negar Hosseini', sport: 'fitness', city: 'اصفهان', rating: 4.9, sessions: 410, bioFa: 'مربی بدنسازی و تغذیه ورزشی.', bioEn: 'Strength and sports nutrition coach.' },
  { nameFa: 'بهنام صادقی', nameEn: 'Behnam Sadeghi', sport: 'fitness', city: 'تهران', rating: 4.5, sessions: 150, bioFa: 'متخصص تمرینات فانکشنال.', bioEn: 'Functional training specialist.' },
  { nameFa: 'لیلا کاظمی', nameEn: 'Leila Kazemi', sport: 'yoga', city: 'تهران', rating: 5.0, sessions: 290, bioFa: 'مربی یوگا و مدیتیشن.', bioEn: 'Yoga and meditation instructor.' },
  { nameFa: 'امیر تهرانی', nameEn: 'Amir Tehrani', sport: 'swim', city: 'مشهد', rating: 4.4, sessions: 130, bioFa: 'مربی شنا و نجات غریق.', bioEn: 'Swimming and lifeguard coach.' },
  { nameFa: 'سینا مرادی', nameEn: 'Sina Moradi', sport: 'basketball', city: 'تهران', rating: 4.6, sessions: 175, bioFa: 'مربی بسکتبال و آمادگی جسمانی.', bioEn: 'Basketball and conditioning coach.' },
  { nameFa: 'کیان عباسی', nameEn: 'Kian Abbasi', sport: 'boxing', city: 'تهران', rating: 4.7, sessions: 200, bioFa: 'مربی بوکس حرفه‌ای و آماتور.', bioEn: 'Professional and amateur boxing coach.' },
]

const newsSeeds = [
  { slug: 'shushzerv-launch', sport: 'tennis', titleFa: 'شوش‌زرو رسماً راه‌اندازی شد', titleEn: 'Shushzerv officially launches', excerptFa: 'پلتفرم رزرو ورزشی شوش‌زرو با ده‌ها باشگاه آغاز به کار کرد.', excerptEn: 'The Shushzerv sports booking platform launches with dozens of clubs.' },
  { slug: 'padel-rising', sport: 'padel', titleFa: 'پدل؛ ورزش در حال رشد ایران', titleEn: 'Padel: Iran’s fastest growing sport', excerptFa: 'محبوبیت پدل در شهرهای بزرگ به‌سرعت در حال افزایش است.', excerptEn: 'Padel popularity is rising fast in major cities.' },
  { slug: 'winter-fitness-tips', sport: 'fitness', titleFa: 'نکات تمرین در فصل سرد', titleEn: 'Fitness tips for the cold season', excerptFa: 'چطور در زمستان انگیزه تمرین را حفظ کنیم.', excerptEn: 'How to stay motivated to train in winter.' },
  { slug: 'yoga-for-athletes', sport: 'yoga', titleFa: 'یوگا برای ورزشکاران', titleEn: 'Yoga for athletes', excerptFa: 'یوگا چطور به ریکاوری و انعطاف کمک می‌کند.', excerptEn: 'How yoga helps recovery and flexibility.' },
  { slug: 'swimming-season', sport: 'swim', titleFa: 'فصل جدید سانس‌های شنا', titleEn: 'New swimming season slots', excerptFa: 'سانس‌های جدید استخرها اضافه شد.', excerptEn: 'New pool slots have been added.' },
  { slug: 'book-pay-at-club', titleFa: 'رزرو کن، در باشگاه پرداخت کن', titleEn: 'Book now, pay at the club', excerptFa: 'در نسخه فعلی پرداخت به صورت حضوری انجام می‌شود.', excerptEn: 'In the current version, payment is made in person.' },
]

async function main() {
  console.log('Resetting tables…')
  await prisma.walletTransaction.deleteMany()
  await prisma.clubWallet.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversationMember.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.userBadge.deleteMany()
  await prisma.review.deleteMany()
  await prisma.planAssignment.deleteMany()
  await prisma.trainingPlan.deleteMany()
  await prisma.matchParticipant.deleteMany()
  await prisma.openMatch.deleteMany()
  await prisma.classEnrollment.deleteMany()
  await prisma.classSession.deleteMany()
  await prisma.clubActivity.deleteMany()
  await prisma.athleteProfile.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.slot.deleteMany()
  await prisma.court.deleteMany()
  await prisma.coach.deleteMany()
  await prisma.newsArticle.deleteMany()
  await prisma.club.deleteMany()
  await prisma.sport.deleteMany()
  await prisma.user.deleteMany()

  console.log('Seeding sports…')
  const sports: Record<string, string> = {}
  for (const s of sportsData) {
    const created = await prisma.sport.create({ data: s })
    sports[s.slug] = created.id
  }

  console.log('Seeding demo users…')
  const athlete = await prisma.user.create({
    data: { email: 'athlete@shushzerv.local', name: 'آرش ورزشکار', role: 'ATHLETE', passwordHash: hashSecret('demo1234') },
  })
  const coachUser = await prisma.user.create({
    data: { email: 'coach@shushzerv.local', name: 'سارا محمدی', role: 'COACH', passwordHash: hashSecret('demo1234') },
  })
  const clubAdmin = await prisma.user.create({
    data: { email: 'club@shushzerv.local', name: 'مدیر باشگاه آزادی', role: 'CLUB_ADMIN', passwordHash: hashSecret('demo1234') },
  })
  const platformAdmin = await prisma.user.create({
    data: { email: 'admin@shushzerv.local', name: 'مدیر پلتفرم', role: 'PLATFORM_ADMIN', passwordHash: hashSecret('demo1234') },
  })

  console.log('Seeding clubs + courts…')
  const courtIds: Array<{ id: string; sportSlug: string; priceFrom: number }> = []
  for (const [i, c] of clubSeeds.entries()) {
    const [lat, lng] = clubCoords(c.city, c.district, i)
    const club = await prisma.club.create({
      data: {
        slug: c.slug,
        nameFa: c.nameFa,
        nameEn: c.nameEn,
        addressFa: `${c.city}، ${c.district}`,
        addressEn: `${districtsEn[c.district] ?? c.district}, ${citiesEn[c.city]}`,
        city: c.city,
        district: c.district,
        lat,
        lng,
        rating: c.rating,
        priceFrom: c.priceFrom,
        discount: c.discount ?? null,
        featured: c.featured ?? false,
        ownerId: i === 0 ? clubAdmin.id : null,
      },
    })
    const courtCount = c.sport === 'football' || c.sport === 'swim' ? 2 : 3
    for (let n = 1; n <= courtCount; n++) {
      const court = await prisma.court.create({
        data: {
          nameFa: `زمین ${n}`,
          nameEn: `Court ${n}`,
          surface: c.sport === 'tennis' ? 'Hard' : null,
          clubId: club.id,
          sportId: sports[c.sport],
        },
      })
      courtIds.push({ id: court.id, sportSlug: c.sport, priceFrom: c.priceFrom })
    }
  }

  console.log('Seeding slots (rolling 14 days)…')
  const slotData: Array<{ date: string; startTime: string; endTime: string; price: number; courtId: string }> = []
  for (const court of courtIds) {
    for (let day = 0; day < 14; day++) {
      const date = isoDate(day)
      for (const [start, end] of TIME_SLOTS) {
        slotData.push({ date, startTime: start, endTime: end, price: court.priceFrom, courtId: court.id })
      }
    }
  }
  await prisma.slot.createMany({ data: slotData })

  console.log('Seeding coaches…')
  const coachIds: Record<string, string> = {}
  for (const [i, c] of coachSeeds.entries()) {
    const coach = await prisma.coach.create({
      data: {
        nameFa: c.nameFa,
        nameEn: c.nameEn,
        city: c.city,
        rating: c.rating,
        sessions: c.sessions,
        bioFa: c.bioFa,
        bioEn: c.bioEn,
        sportId: sports[c.sport],
        userId: i === 0 ? coachUser.id : null,
      },
    })
    if (i === 0) coachIds.sara = coach.id
    if (c.sport === 'yoga') coachIds.leila = coach.id
    if (c.sport === 'fitness') coachIds.negar = coach.id
  }

  const clubs = await prisma.club.findMany({ select: { id: true, slug: true, city: true } })
  const clubBySlug = Object.fromEntries(clubs.map((c) => [c.slug, c]))

  console.log('Seeding athlete profile…')
  await prisma.athleteProfile.create({
    data: { userId: athlete.id, sportId: sports.tennis, level: 'INTERMEDIATE', matchesPlayed: 24, wins: 14, xp: 260 },
  })
  for (const code of ['first_booking', 'regular', 'social_player', 'rising_star']) {
    await prisma.userBadge.create({ data: { userId: athlete.id, code } })
  }

  console.log('Seeding group classes…')
  const classSeeds = [
    { club: 'zen-yoga-studio', coach: coachIds.leila, sport: 'yoga', titleFa: 'یوگای صبحگاهی', titleEn: 'Morning Yoga', day: 1, time: '08:00', end: '09:30', price: 180000, seats: 15, booked: 8 },
    { club: 'azadi-tennis', coach: coachIds.sara, sport: 'tennis', titleFa: 'کلاس تنیس مبتدی', titleEn: 'Beginner Tennis Class', day: 2, time: '10:00', end: '11:30', price: 220000, seats: 8, booked: 5 },
    { club: 'iron-house-gym', coach: coachIds.negar, sport: 'fitness', titleFa: 'فیتنس گروهی', titleEn: 'Group Fitness', day: 3, time: '18:00', end: '19:30', price: 150000, seats: 20, booked: 12 },
    { club: 'padel-zone-tehran', sport: 'padel', titleFa: 'آموزش پدل', titleEn: 'Padel Intro Class', day: 4, time: '16:00', end: '17:30', price: 280000, seats: 4, booked: 2 },
  ]
  for (const cs of classSeeds) {
    await prisma.classSession.create({
      data: {
        titleFa: cs.titleFa,
        titleEn: cs.titleEn,
        date: isoDate(cs.day),
        startTime: cs.time,
        endTime: cs.end,
        price: cs.price,
        maxSeats: cs.seats,
        bookedSeats: cs.booked,
        clubId: clubBySlug[cs.club]!.id,
        sportId: sports[cs.sport],
        coachId: cs.coach ?? null,
      },
    })
  }

  console.log('Seeding open matches…')
  const matchSeeds = [
    { sport: 'tennis', city: 'تهران', club: 'azadi-tennis', day: 2, time: '18:00', max: 4, joined: 2, min: 'INTERMEDIATE', maxL: 'ADVANCED', notesFa: 'دو نفر جا داریم', notesEn: 'Looking for 2 more players' },
    { sport: 'padel', city: 'تهران', club: 'padel-zone-tehran', day: 3, time: '20:00', max: 4, joined: 3, min: 'BEGINNER', maxL: 'INTERMEDIATE', notesFa: 'بازی دوستانه', notesEn: 'Friendly doubles game' },
    { sport: 'football', city: 'تهران', club: 'green-turf-arena', day: 5, time: '19:00', max: 10, joined: 7, min: 'BEGINNER', maxL: 'PRO', notesFa: 'فوتبال ۵ نفره', notesEn: '5-a-side football' },
  ]
  for (const [mi, ms] of matchSeeds.entries()) {
    const match = await prisma.openMatch.create({
      data: {
        sportId: sports[ms.sport],
        city: ms.city,
        clubId: clubBySlug[ms.club]?.id,
        creatorId: athlete.id,
        date: isoDate(ms.day),
        startTime: ms.time,
        maxPlayers: ms.max,
        joinedCount: ms.joined,
        minLevel: ms.min as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO',
        maxLevel: ms.maxL as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO',
        notesFa: ms.notesFa,
        notesEn: ms.notesEn,
        shareToken: `demo${mi + 1}match`,
      },
    })
    await prisma.matchParticipant.create({ data: { matchId: match.id, userId: athlete.id } })
    await prisma.conversation.create({
      data: {
        isGroup: true,
        matchId: match.id,
        titleFa: `بازی ${ms.city}`,
        titleEn: `Match in ${ms.city}`,
        members: { create: { userId: athlete.id } },
      },
    })
  }

  console.log('Seeding training plans…')
  const plan = await prisma.trainingPlan.create({
    data: {
      coachId: coachIds.sara,
      sportId: sports.tennis,
      titleFa: 'برنامه تنیس ۴ هفته‌ای',
      titleEn: '4-week tennis program',
      bodyFa: 'هفته ۱: سرویس و فورهند\nهفته ۲: بکند و والی\nهفته ۳: تاکتیک بازی\nهفته ۴: مسابقه تمرینی',
      bodyEn: 'Week 1: Serve & forehand\nWeek 2: Backhand & volley\nWeek 3: Match tactics\nWeek 4: Practice match',
    },
  })
  await prisma.planAssignment.create({ data: { planId: plan.id, athleteId: athlete.id } })

  console.log('Seeding club activities…')
  const activitySeeds = [
    { club: 'azadi-tennis', titleFa: 'تورنمنت تنیس آخر هفته', titleEn: 'Weekend Tennis Tournament', descFa: 'مسابقه دو نفره آزاد', descEn: 'Open doubles tournament', day: 6, time: '09:00' },
    { club: 'padel-zone-tehran', titleFa: 'شب پدل', titleEn: 'Padel Night', descFa: 'بازی گروهی و شبکه‌سازی', descEn: 'Social padel evening', day: 7, time: '20:00' },
  ]
  for (const a of activitySeeds) {
    await prisma.clubActivity.create({
      data: {
        clubId: clubBySlug[a.club]!.id,
        titleFa: a.titleFa,
        titleEn: a.titleEn,
        descFa: a.descFa,
        descEn: a.descEn,
        date: isoDate(a.day),
        startTime: a.time,
      },
    })
  }

  console.log('Seeding news…')
  for (const n of newsSeeds) {
    await prisma.newsArticle.create({
      data: {
        slug: n.slug,
        titleFa: n.titleFa,
        titleEn: n.titleEn,
        excerptFa: n.excerptFa,
        excerptEn: n.excerptEn,
        bodyFa: `${n.excerptFa}\n\nاین یک متن نمونه برای نسخه دموی شوش‌زرو است. محتوای کامل مقاله در نسخه‌های بعدی اضافه خواهد شد.`,
        bodyEn: `${n.excerptEn}\n\nThis is placeholder body text for the Shushzerv demo. Full article content will be added in later versions.`,
        date: isoDate(-newsSeeds.indexOf(n) - 1),
        sportId: n.sport ? sports[n.sport] : null,
      },
    })
  }

  console.log('Seeding reviews…')
  const reviewSeeds = [
    { club: 'azadi-tennis', rating: 5, fa: 'رزرو فوق‌العاده ساده بود و زمین عالی. حتماً دوباره استفاده می‌کنم.', en: 'Booking was super simple and the court was great. Will definitely use again.' },
    { club: 'padel-zone-tehran', rating: 5, fa: 'بهترین راه برای پیدا کردن همبازی و رزرو زمین پدل. عاشقش شدم!', en: 'The best way to find partners and book a padel court. Loved it!' },
    { club: 'green-turf-arena', rating: 5, fa: 'بدون دردسر، بدون تماس تلفنی، فقط چند کلیک تا بازی.', en: 'No hassle, no phone calls, just a few clicks to play.' },
    { club: 'zen-yoga-studio', rating: 5, fa: 'برنامه لحظه‌ای و پرداخت در محل کار را خیلی راحت کرده.', en: 'Real-time schedule and pay-at-club made everything so easy.' },
    { club: 'iron-house-gym', rating: 4, fa: 'تجربه روان و سریع. قیمت‌ها هم شفاف هستند.', en: 'Smooth and fast experience. Pricing is transparent too.' },
    { club: 'hoops-basketball-arena', rating: 5, fa: 'پیدا کردن زمین نزدیک خونه عالیه. پیشنهاد می‌کنم.', en: 'Finding a court near home is great. Highly recommend.' },
  ]
  for (const r of reviewSeeds) {
    await prisma.review.create({
      data: {
        rating: r.rating,
        bodyFa: r.fa,
        bodyEn: r.en,
        userId: athlete.id,
        clubId: clubBySlug[r.club]?.id ?? null,
      },
    })
  }

  console.log('Seeding wallets…')
  await prisma.wallet.create({ data: { userId: athlete.id, balance: 2_500_000 } })
  await prisma.wallet.create({ data: { userId: coachUser.id, balance: 850_000 } })
  await prisma.wallet.create({ data: { userId: clubAdmin.id, balance: 0 } })
  await prisma.wallet.create({ data: { userId: platformAdmin.id, balance: 420_000 } })

  const azadiClub = clubBySlug['azadi-tennis']
  if (azadiClub) {
    await prisma.clubWallet.create({ data: { clubId: azadiClub.id, balance: 1_850_000 } })
    await prisma.walletTransaction.createMany({
      data: [
        {
          type: 'TOP_UP',
          amount: 3_000_000,
          balanceAfter: 3_000_000,
          userId: athlete.id,
          noteFa: 'شارژ اولیه کیف پول',
          noteEn: 'Initial wallet top-up',
        },
        {
          type: 'BOOKING',
          amount: -250_000,
          balanceAfter: 2_750_000,
          userId: athlete.id,
          referenceId: 'demo-booking-1',
          noteFa: 'پرداخت رزرو زمین',
          noteEn: 'Court booking payment',
        },
        {
          type: 'BOOKING',
          amount: 225_000,
          balanceAfter: 225_000,
          clubId: azadiClub.id,
          referenceId: 'demo-booking-1',
          noteFa: 'دریافت رزرو زمین',
          noteEn: 'Court booking received',
        },
        {
          type: 'PLATFORM_FEE',
          amount: 25_000,
          balanceAfter: 25_000,
          userId: platformAdmin.id,
          referenceId: 'demo-booking-1',
          noteFa: 'کارمزد پلتفرم — رزرو',
          noteEn: 'Platform fee — booking',
        },
        {
          type: 'COACH_EARNING',
          amount: 33_000,
          balanceAfter: 883_000,
          userId: coachUser.id,
          referenceId: 'demo-class-1',
          noteFa: 'درآمد مربی — کلاس',
          noteEn: 'Coach earning — class',
        },
      ],
    })
  }

  const counts = {
    sports: await prisma.sport.count(),
    clubs: await prisma.club.count(),
    courts: await prisma.court.count(),
    slots: await prisma.slot.count(),
    coaches: await prisma.coach.count(),
    classes: await prisma.classSession.count(),
    matches: await prisma.openMatch.count(),
    plans: await prisma.trainingPlan.count(),
    news: await prisma.newsArticle.count(),
    users: await prisma.user.count(),
  }
  console.log('Seed complete:', counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
