import { PrismaClient } from '@prisma/client'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'

const prisma = new PrismaClient()
const scrypt = new Scrypt({})
const hashPassword = (pw: string) => scrypt.make(pw)

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
  return d.toISOString().slice(0, 10)
}

const sportsData = [
  { slug: 'tennis', nameFa: 'تنیس', nameEn: 'Tennis', icon: '🎾', color: '#34c759', group: 'racket' },
  { slug: 'padel', nameFa: 'پدل', nameEn: 'Padel', icon: '🏓', color: '#30b0c7', group: 'racket' },
  { slug: 'football', nameFa: 'فوتبال', nameEn: 'Football', icon: '⚽', color: '#007aff', group: 'ball' },
  { slug: 'fitness', nameFa: 'بدنسازی', nameEn: 'Fitness', icon: '🏋️', color: '#ff9500', group: 'fitness' },
  { slug: 'yoga', nameFa: 'یوگا', nameEn: 'Yoga', icon: '🧘', color: '#af52de', group: 'fitness' },
  { slug: 'swim', nameFa: 'شنا', nameEn: 'Swimming', icon: '🏊', color: '#5856d6', group: 'water' },
  { slug: 'basketball', nameFa: 'بسکتبال', nameEn: 'Basketball', icon: '🏀', color: '#ff2d55', group: 'ball' },
  { slug: 'boxing', nameFa: 'بوکس', nameEn: 'Boxing', icon: '🥊', color: '#636366', group: 'combat' },
]

const cities = ['تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز']
const citiesEn: Record<string, string> = { 'تهران': 'Tehran', 'اصفهان': 'Isfahan', 'شیراز': 'Shiraz', 'مشهد': 'Mashhad', 'تبریز': 'Tabriz' }

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
    data: { email: 'athlete@shushzerv.local', name: 'آرش ورزشکار', role: 'ATHLETE', passwordHash: await hashPassword('demo1234') },
  })
  const coachUser = await prisma.user.create({
    data: { email: 'coach@shushzerv.local', name: 'سارا محمدی', role: 'COACH', passwordHash: await hashPassword('demo1234') },
  })
  const clubAdmin = await prisma.user.create({
    data: { email: 'club@shushzerv.local', name: 'مدیر باشگاه آزادی', role: 'CLUB_ADMIN', passwordHash: await hashPassword('demo1234') },
  })

  console.log('Seeding clubs + courts…')
  const courtIds: Array<{ id: string; sportSlug: string; priceFrom: number }> = []
  for (const [i, c] of clubSeeds.entries()) {
    const club = await prisma.club.create({
      data: {
        slug: c.slug,
        nameFa: c.nameFa,
        nameEn: c.nameEn,
        addressFa: `${c.city}، ${c.district}`,
        addressEn: `${c.district}, ${citiesEn[c.city]}`,
        city: c.city,
        district: c.district,
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
  for (const [i, c] of coachSeeds.entries()) {
    await prisma.coach.create({
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

  const counts = {
    sports: await prisma.sport.count(),
    clubs: await prisma.club.count(),
    courts: await prisma.court.count(),
    slots: await prisma.slot.count(),
    coaches: await prisma.coach.count(),
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
