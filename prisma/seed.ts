import { PrismaClient, type Role, SlotStatus } from '@prisma/client'
import { hashSecret } from '../server/utils/password'

const prisma = new PrismaClient()

const DEMO_PASSWORD = 'demo1234'

const sports = [
  { slug: 'tennis', nameFa: 'تنیس', nameEn: 'Tennis', icon: '🎾', color: '#34c759', group: 'racket' },
  { slug: 'padel', nameFa: 'پدل', nameEn: 'Padel', icon: '🥎', color: '#30b0c7', group: 'racket' },
  { slug: 'football', nameFa: 'فوتبال', nameEn: 'Football', icon: '⚽️', color: '#007aff', group: 'ball' },
  { slug: 'basketball', nameFa: 'بسکتبال', nameEn: 'Basketball', icon: '🏀', color: '#ff9500', group: 'ball' },
  { slug: 'fitness', nameFa: 'بدنسازی', nameEn: 'Fitness', icon: '🏋️', color: '#5856d6', group: 'fitness' },
  { slug: 'yoga', nameFa: 'یوگا', nameEn: 'Yoga', icon: '🧘', color: '#ff2d55', group: 'fitness' },
  { slug: 'swim', nameFa: 'شنا', nameEn: 'Swimming', icon: '🏊', color: '#30b0c7', group: 'water' },
  { slug: 'boxing', nameFa: 'بوکس', nameEn: 'Boxing', icon: '🥊', color: '#48484a', group: 'combat' },
]

const cities = [
  { en: 'Tehran', fa: 'تهران', districts: ['ولنجک', 'سعادت‌آباد', 'الهیه', 'ونک'] },
  { en: 'Isfahan', fa: 'اصفهان', districts: ['چهارباغ', 'سپاهان‌شهر'] },
  { en: 'Shiraz', fa: 'شیراز', districts: ['معالی‌آباد', 'قصردشت'] },
  { en: 'Mashhad', fa: 'مشهد', districts: ['وکیل‌آباد', 'احمدآباد'] },
]

const clubAdjFa = ['المپیک', 'پارس', 'آریا', 'نقش‌جهان', 'پاسارگاد', 'کوروش', 'البرز', 'ستارگان', 'پرسپولیس', 'آزادی', 'انقلاب', 'میلاد', 'زاگرس', 'دماوند', 'کاسپین', 'خلیج‌فارس']
const clubAdjEn = ['Olympic', 'Pars', 'Aria', 'NaqsheJahan', 'Pasargad', 'Cyrus', 'Alborz', 'Setaregan', 'Persepolis', 'Azadi', 'Enqelab', 'Milad', 'Zagros', 'Damavand', 'Caspian', 'PersianGulf']

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function dateStr(offsetDays: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

const TIME_SLOTS = [
  { startTime: '08:00', endTime: '09:30' },
  { startTime: '10:00', endTime: '11:30' },
  { startTime: '12:00', endTime: '13:30' },
  { startTime: '16:00', endTime: '17:30' },
  { startTime: '18:00', endTime: '19:30' },
  { startTime: '20:00', endTime: '21:30' },
]

async function main() {
  console.log('Resetting data…')
  await prisma.booking.deleteMany()
  await prisma.slot.deleteMany()
  await prisma.court.deleteMany()
  await prisma.coach.deleteMany()
  await prisma.club.deleteMany()
  await prisma.newsArticle.deleteMany()
  await prisma.sport.deleteMany()
  await prisma.user.deleteMany()

  // --- Sports ---
  console.log('Seeding sports…')
  const sportRecords = await Promise.all(
    sports.map((s) => prisma.sport.create({ data: s })),
  )
  const sportBySlug = Object.fromEntries(sportRecords.map((s) => [s.slug, s]))

  // --- Demo users ---
  console.log('Seeding demo users…')
  const passwordHash = hashSecret(DEMO_PASSWORD)
  const athlete = await prisma.user.create({
    data: { email: 'athlete@shushzerv.app', passwordHash, name: 'علی ورزشکار', role: 'ATHLETE' as Role },
  })
  const coachUser = await prisma.user.create({
    data: { email: 'coach@shushzerv.app', passwordHash, name: 'مربی نمونه', role: 'COACH' as Role },
  })
  const clubAdmin = await prisma.user.create({
    data: { email: 'club@shushzerv.app', passwordHash, name: 'مدیر باشگاه', role: 'CLUB_ADMIN' as Role },
  })

  // --- Clubs + courts + slots ---
  console.log('Seeding clubs, courts and slots…')
  const clubCount = 16
  for (let i = 0; i < clubCount; i++) {
    const city = rand(cities)
    const district = rand(city.districts)
    const featured = i < 6
    // first 6 clubs owned by the club admin demo account
    const ownerId = i < 6 ? clubAdmin.id : null

    const club = await prisma.club.create({
      data: {
        slug: `club-${i + 1}-${clubAdjEn[i].toLowerCase()}`,
        nameFa: `باشگاه ${clubAdjFa[i]}`,
        nameEn: `${clubAdjEn[i]} Club`,
        addressFa: `${city.fa}، ${district}، خیابان اصلی، پلاک ${randInt(1, 120)}`,
        addressEn: `${district}, Main St ${randInt(1, 120)}, ${city.en}`,
        city: city.en,
        district,
        rating: Number((Math.random() * 1.4 + 3.6).toFixed(1)),
        priceFrom: randInt(15, 60) * 10000,
        discount: Math.random() > 0.6 ? randInt(10, 30) : null,
        featured,
        ownerId,
      },
    })

    // 1-3 courts, each tied to a sport
    const courtCount = randInt(1, 3)
    const usedSports = new Set<string>()
    for (let c = 0; c < courtCount; c++) {
      let sport = rand(sportRecords)
      let guard = 0
      while (usedSports.has(sport.slug) && guard++ < 5) sport = rand(sportRecords)
      usedSports.add(sport.slug)

      const court = await prisma.court.create({
        data: {
          nameFa: `زمین ${c + 1}`,
          nameEn: `Court ${c + 1}`,
          surface: rand(['hard', 'clay', 'grass', 'indoor']),
          clubId: club.id,
          sportId: sport.id,
        },
      })

      // slots for the next 14 days
      const slotData: { date: string; startTime: string; endTime: string; price: number; status: SlotStatus; courtId: string }[] = []
      for (let day = 0; day < 14; day++) {
        for (const t of TIME_SLOTS) {
          slotData.push({
            date: dateStr(day),
            startTime: t.startTime,
            endTime: t.endTime,
            price: club.priceFrom + randInt(0, 5) * 10000,
            status: Math.random() > 0.78 ? SlotStatus.BOOKED : SlotStatus.AVAILABLE,
            courtId: court.id,
          })
        }
      }
      await prisma.slot.createMany({ data: slotData })
    }
  }

  // --- Coaches ---
  console.log('Seeding coaches…')
  const coachNamesFa = ['رضا محمدی', 'سارا کریمی', 'امیر حسینی', 'نگار رستمی', 'بابک تقوی', 'مینا اکبری', 'حسام رضایی', 'لیلا نوری', 'پویا صادقی', 'الهام فرهادی']
  const coachNamesEn = ['Reza Mohammadi', 'Sara Karimi', 'Amir Hosseini', 'Negar Rostami', 'Babak Taghavi', 'Mina Akbari', 'Hesam Rezaei', 'Leila Noori', 'Pouya Sadeghi', 'Elham Farhadi']
  for (let i = 0; i < 10; i++) {
    const sport = rand(sportRecords)
    const city = rand(cities)
    await prisma.coach.create({
      data: {
        nameFa: coachNamesFa[i],
        nameEn: coachNamesEn[i],
        city: city.en,
        rating: Number((Math.random() * 1.2 + 3.8).toFixed(1)),
        sessions: randInt(40, 600),
        bioFa: 'مربی باتجربه با سال‌ها سابقه آموزش در سطوح مختلف.',
        bioEn: 'Experienced coach with years of training athletes at all levels.',
        sportId: sport.id,
        userId: i === 0 ? coachUser.id : null,
      },
    })
  }

  // --- News ---
  console.log('Seeding news…')
  const news = [
    { slug: 'season-opening', sport: 'tennis', titleFa: 'آغاز فصل جدید تنیس', titleEn: 'New tennis season kicks off', excerptFa: 'باشگاه‌ها برای فصل جدید آماده می‌شوند.', excerptEn: 'Clubs gear up for the new season.' },
    { slug: 'padel-boom', sport: 'padel', titleFa: 'محبوبیت روزافزون پدل', titleEn: 'Padel keeps booming', excerptFa: 'زمین‌های پدل در شهرها افزایش یافت.', excerptEn: 'Padel courts are popping up across cities.' },
    { slug: 'fitness-tips', sport: 'fitness', titleFa: 'نکات تمرینی برای زمستان', titleEn: 'Winter training tips', excerptFa: 'با این نکات فرم بدنی خود را حفظ کنید.', excerptEn: 'Stay in shape this winter with these tips.' },
    { slug: 'youth-league', sport: 'football', titleFa: 'لیگ جوانان آغاز شد', titleEn: 'Youth league begins', excerptFa: 'تیم‌های جوان وارد رقابت شدند.', excerptEn: 'Young teams enter the competition.' },
    { slug: 'swim-health', sport: 'swim', titleFa: 'فواید شنا برای سلامتی', titleEn: 'Health benefits of swimming', excerptFa: 'شنا یکی از کامل‌ترین ورزش‌هاست.', excerptEn: 'Swimming is one of the most complete sports.' },
    { slug: 'coach-spotlight', sport: 'boxing', titleFa: 'معرفی مربی برتر ماه', titleEn: 'Coach of the month', excerptFa: 'با مربی منتخب این ماه آشنا شوید.', excerptEn: 'Meet our featured coach this month.' },
  ]
  for (let i = 0; i < news.length; i++) {
    const n = news[i]
    await prisma.newsArticle.create({
      data: {
        slug: n.slug,
        titleFa: n.titleFa,
        titleEn: n.titleEn,
        excerptFa: n.excerptFa,
        excerptEn: n.excerptEn,
        bodyFa: `${n.excerptFa}\n\nاین یک مطلب نمایشی است که برای نمایش ساختار صفحه خبر تهیه شده است. محتوای کامل در نسخه‌های بعدی اضافه خواهد شد.`,
        bodyEn: `${n.excerptEn}\n\nThis is demo content used to show the article layout. Full content will be added in later versions.`,
        date: dateStr(-randInt(1, 30)),
        sportId: sportBySlug[n.sport]?.id ?? null,
      },
    })
  }

  const counts = {
    users: await prisma.user.count(),
    sports: await prisma.sport.count(),
    clubs: await prisma.club.count(),
    courts: await prisma.court.count(),
    slots: await prisma.slot.count(),
    coaches: await prisma.coach.count(),
    news: await prisma.newsArticle.count(),
  }
  console.log('Seed complete:', counts)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
