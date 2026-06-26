import { PrismaClient } from '@prisma/client'
import { BRAND_PRIMARY } from '../server/utils/palette.ts'
import { hashSecret } from '../server/utils/password.ts'
import { buildSlotTimes } from '../server/utils/slotSchedule.ts'

const prisma = new PrismaClient()

const SEED_SLOT_DURATION = 120
const SEED_OPEN = '08:00'
const SEED_CLOSE = '22:00'
const SEED_SLOT_TIMES = buildSlotTimes(SEED_SLOT_DURATION, SEED_OPEN, SEED_CLOSE)

function isoDate(offsetDays: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const sportsData = [
  { slug: 'tennis', nameFa: 'تنیس', nameEn: 'Tennis', icon: 'tennis', color: BRAND_PRIMARY, group: 'racket' },
  { slug: 'padel', nameFa: 'پدل', nameEn: 'Padel', icon: 'padel', color: BRAND_PRIMARY, group: 'racket' },
  { slug: 'football', nameFa: 'فوتبال', nameEn: 'Football', icon: 'football', color: BRAND_PRIMARY, group: 'ball' },
  { slug: 'fitness', nameFa: 'بدنسازی', nameEn: 'Fitness', icon: 'fitness', color: BRAND_PRIMARY, group: 'fitness' },
  { slug: 'yoga', nameFa: 'یوگا', nameEn: 'Yoga', icon: 'yoga', color: BRAND_PRIMARY, group: 'fitness' },
  { slug: 'swim', nameFa: 'شنا', nameEn: 'Swimming', icon: 'swim', color: BRAND_PRIMARY, group: 'water' },
  { slug: 'basketball', nameFa: 'بسکتبال', nameEn: 'Basketball', icon: 'basketball', color: BRAND_PRIMARY, group: 'ball' },
  { slug: 'boxing', nameFa: 'بوکس', nameEn: 'Boxing', icon: 'boxing', color: BRAND_PRIMARY, group: 'combat' },
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

const demoImage = {
  club: (slug: string) => `/demo/clubs/${slug}.jpg`,
  coach: (index: number) => `/demo/coaches/coach-${index + 1}.jpg`,
  news: (slug: string) => `/demo/news/${slug}.jpg`,
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

const sportClubMap: Record<string, string> = {
  tennis: 'azadi-tennis',
  padel: 'padel-zone-tehran',
  football: 'green-turf-arena',
  fitness: 'iron-house-gym',
  yoga: 'zen-yoga-studio',
  swim: 'aqua-swim-center',
  basketball: 'hoops-basketball-arena',
  boxing: 'knockout-boxing-club',
}

const newsSeeds = [
  {
    slug: 'in-box-s-launch',
    sport: 'tennis',
    titleFa: 'این باکس رسماً راه‌اندازی شد',
    titleEn: 'IN BOX S officially launches',
    excerptFa: 'پلتفرم رزرو ورزشی این باکس با ده‌ها باشگاه آغاز به کار کرد.',
    excerptEn: 'The IN BOX S sports booking platform launches with dozens of clubs.',
    bodyFa: 'امروز پلتفرم این باکس با بیش از ۱۵ باشگاه فعال در پنج شهر بزرگ ایران راه‌اندازی شد. کاربران می‌توانند زمین، کلاس گروهی و بازی عمومی را در یک جا رزرو کنند.\n\nاز ویژگی‌های اولیه: جستجوی لحظه‌ای سانس‌ها، پرداخت در باشگاه، بازی عمومی با لینک اشتراک‌گذاری و داشبورد ورزشکار برای پیگیری رزروها.\n\nدر هفته‌های آینده باشگاه‌های بیشتری به شبکه اضافه می‌شوند.',
    bodyEn: 'IN BOX S goes live today with more than 15 active clubs across five major Iranian cities. Users can book courts, group classes, and open matches in one place.\n\nLaunch features include live slot search, pay-at-club checkout, shareable open-match links, and an athlete dashboard to track bookings.\n\nMore clubs will join the network in the coming weeks.',
  },
  {
    slug: 'padel-rising',
    sport: 'padel',
    titleFa: 'پدل؛ ورزش در حال رشد ایران',
    titleEn: 'Padel: Iran’s fastest growing sport',
    excerptFa: 'محبوبیت پدل در شهرهای بزرگ به‌سرعت در حال افزایش است.',
    excerptEn: 'Padel popularity is rising fast in major cities.',
    bodyFa: 'پدل در دو سال اخیر یکی از پررشدترین ورزش‌های راکتی در تهران و اصفهان شده است. باشگاه‌های جدید هر ماه زمین‌های سرپوشیده و روباز اضافه می‌کنند.\n\nاین باکس برای اولین بار امکان رزرو آنلاین زمین پدل و پیدا کردن همبازی در همان سانس را فراهم کرده است.\n\nاگر تازه‌کار هستید، کلاس‌های مقدماتی باشگاه‌های شریک را در بخش کلاس‌ها ببینید.',
    bodyEn: 'Padel has become one of the fastest-growing racket sports in Tehran and Isfahan over the past two years. New clubs add indoor and outdoor courts every month.\n\nIN BOX S is the first platform to combine online padel court booking with finding partners for the same slot.\n\nNew to the sport? Check intro classes from partner clubs in the Classes section.',
  },
  {
    slug: 'winter-fitness-tips',
    sport: 'fitness',
    titleFa: 'نکات تمرین در فصل سرد',
    titleEn: 'Fitness tips for the cold season',
    excerptFa: 'چطور در زمستان انگیزه تمرین را حفظ کنیم.',
    excerptEn: 'How to stay motivated to train in winter.',
    bodyFa: 'سرمای زمستان اغلب برنامه تمرین را مختل می‌کند. سه عادت ساده کمک می‌کند: زمان ثابت هفتگی، گرم‌کردن طولانی‌تر و هدف کوتاه‌مدت هفتگی.\n\nباشگاه‌های شریک این باکس سانس‌های صبح زود و عصر را با ظرفیت محدود نگه می‌دارند تا از شلوغی جلوگیری شود.\n\nبا رزرو از قبل، دیگر لازم نیست سر درب باشگاه بپیچید تا ببینید جا دارید یا نه.',
    bodyEn: 'Cold weather often disrupts training routines. Three simple habits help: a fixed weekly time, a longer warm-up, and a short weekly goal.\n\nPartner gyms on IN BOX S keep morning and evening slots at limited capacity to avoid overcrowding.\n\nBook ahead so you no longer have to show up at the door wondering if space is available.',
  },
  {
    slug: 'yoga-for-athletes',
    sport: 'yoga',
    titleFa: 'یوگا برای ورزشکاران',
    titleEn: 'Yoga for athletes',
    excerptFa: 'یوگا چطور به ریکاوری و انعطاف کمک می‌کند.',
    excerptEn: 'How yoga helps recovery and flexibility.',
    bodyFa: 'ورزشکاران حرفه‌ای و آمateur هر دو از یوگا برای بهبود دامنه حرکتی و کاهش خستگی عضلانی استفاده می‌کنند.\n\nکلاس‌های یوگای صبحگاهی باشگاه‌های این باکس ترکیبی از حرکات کششی، تنفس و مدیتیشن کوتاه هستند.\n\nحتی یک جلسه در هفته می‌تواند کیفیت خواب و آمادگی برای تمرین بعدی را بهتر کند.',
    bodyEn: 'Both pro and recreational athletes use yoga to improve range of motion and reduce muscle fatigue.\n\nMorning yoga classes at IN BOX S partner studios combine stretching, breath work, and a short meditation.\n\nEven one session per week can improve sleep quality and readiness for your next workout.',
  },
  {
    slug: 'swimming-season',
    sport: 'swim',
    titleFa: 'فصل جدید سانس‌های شنا',
    titleEn: 'New swimming season slots',
    excerptFa: 'سانس‌های جدید استخرها اضافه شد.',
    excerptEn: 'New pool slots have been added.',
    bodyFa: 'باشگاه‌های آبی شریک سانس‌های جدید صبح و عصر برای شنا آزاد و تمرین تکنیک اضافه کرده‌اند.\n\nظرفیت هر سانس محدود است تا فضای کافی برای هر شناگر فراهم شود. رزرو از طریق این باکس ظرف چند ثانیه انجام می‌شود.\n\nبرای خانواده‌ها، سانس‌های آخر هفته با تخفیف فصلی در برخی مجموعه‌ها فعال است.',
    bodyEn: 'Partner aquatics centers have added new morning and evening slots for lap swimming and technique work.\n\nEach session has limited capacity so every swimmer has enough space. Booking through IN BOX S takes seconds.\n\nFamily weekend slots are available with seasonal discounts at select venues.',
  },
  {
    slug: 'book-pay-at-club',
    titleFa: 'رزرو کن، در باشگاه پرداخت کن',
    titleEn: 'Book now, pay at the club',
    excerptFa: 'در نسخه فعلی پرداخت به صورت حضوری انجام می‌شود.',
    excerptEn: 'In the current version, payment is made in person.',
    bodyFa: 'در نسخه فعلی این باکس می‌توانید سانس را آنلاین رزرو کنید و مبلغ را هنگام حضور در باشگاه پرداخت کنید.\n\nاین روش برای باشگاه‌ها و ورزشکاران آشنا است و نیازی به کارت بانکی آنلاین ندارد.\n\nبه‌زودی پرداخت از کیف پول و درگاه بانکی هم به‌صورت اختیاری اضافه می‌شود.',
    bodyEn: 'In the current IN BOX S release you can reserve a slot online and pay when you arrive at the club.\n\nThis familiar flow works well for clubs and athletes and does not require an online card payment.\n\nWallet and bank gateway payments will be added soon as optional checkout methods.',
  },
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
  await prisma.notification.deleteMany()
  await prisma.tournamentRegistration.deleteMany()
  await prisma.tournament.deleteMany()
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
    data: {
      email: 'athlete@inboxs.local',
      name: 'آرش ورزشکار',
      nameEn: 'Arash Athlete',
      role: 'ATHLETE',
      passwordHash: hashSecret('demo1234'),
      onboardedAt: new Date(),
      favoriteSports: 'tennis',
    },
  })
  const coachUser = await prisma.user.create({
    data: { email: 'coach@inboxs.local', name: 'سارا محمدی', nameEn: 'Sara Mohammadi', role: 'COACH', passwordHash: hashSecret('demo1234'), onboardedAt: new Date() },
  })
  const clubAdmin = await prisma.user.create({
    data: { email: 'club@inboxs.local', name: 'مدیر باشگاه آزادی', nameEn: 'Azadi Club Admin', role: 'CLUB_ADMIN', passwordHash: hashSecret('demo1234'), onboardedAt: new Date() },
  })
  const platformAdmin = await prisma.user.create({
    data: { email: 'admin@inboxs.local', name: 'مدیر پلتفرم', nameEn: 'Platform Admin', role: 'PLATFORM_ADMIN', passwordHash: hashSecret('demo1234') },
  })
  const extraPlayers = await Promise.all([
    prisma.user.create({ data: { email: 'player2@inboxs.local', name: 'نیما رضایی', nameEn: 'Nima Rezaei', role: 'ATHLETE', passwordHash: hashSecret('demo1234') } }),
    prisma.user.create({ data: { email: 'player3@inboxs.local', name: 'پریسا کریمی', nameEn: 'Parisa Karimi', role: 'ATHLETE', passwordHash: hashSecret('demo1234') } }),
    prisma.user.create({ data: { email: 'player4@inboxs.local', name: 'امیرحسین نوری', nameEn: 'Amir Hossein Nouri', role: 'ATHLETE', passwordHash: hashSecret('demo1234') } }),
  ])
  const demoUsers: Record<string, string> = {
    athlete: athlete.id,
    player2: extraPlayers[0].id,
    player3: extraPlayers[1].id,
    player4: extraPlayers[2].id,
  }

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
        image: demoImage.club(c.slug),
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
      for (const slot of SEED_SLOT_TIMES) {
        slotData.push({ date, startTime: slot.startTime, endTime: slot.endTime, price: court.priceFrom, courtId: court.id })
      }
    }
  }
  await prisma.slot.createMany({ data: slotData })

  console.log('Seeding demo bookings…')
  const azadiCourt = await prisma.court.findFirst({
    where: { club: { slug: 'azadi-tennis' } },
    orderBy: { nameEn: 'asc' },
  })
  if (azadiCourt) {
    const demoSlots = await prisma.slot.findMany({
      where: { courtId: azadiCourt.id, date: isoDate(1), status: 'AVAILABLE' },
      orderBy: { startTime: 'asc' },
      take: 2,
    })
    if (demoSlots[0]) {
      await prisma.slot.update({ where: { id: demoSlots[0].id }, data: { status: 'BOOKED' } })
      await prisma.booking.create({
        data: {
          userId: athlete.id,
          slotId: demoSlots[0].id,
          source: 'PLATFORM',
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        },
      })
    }
    if (demoSlots[1]) {
      await prisma.slot.update({ where: { id: demoSlots[1].id }, data: { status: 'BOOKED' } })
      await prisma.booking.create({
        data: {
          slotId: demoSlots[1].id,
          source: 'CLUB',
          guestName: 'علی محمدی',
          paymentStatus: 'PAY_AT_CLUB',
          status: 'CONFIRMED',
        },
      })
    }
  }

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
        photo: demoImage.coach(i),
        sportId: sports[c.sport],
        userId: i === 0 ? coachUser.id : null,
      },
    })
    if (i === 0) coachIds.sara = coach.id
    if (c.sport === 'yoga') coachIds.leila = coach.id
    if (c.sport === 'fitness') coachIds.negar = coach.id
    if (c.sport === 'padel') coachIds.maryam = coach.id
    if (c.sport === 'football') coachIds.ali = coach.id
    if (c.sport === 'basketball') coachIds.sina = coach.id
  }

  const clubs = await prisma.club.findMany({ select: { id: true, slug: true, city: true } })
  const clubBySlug = Object.fromEntries(clubs.map((c) => [c.slug, c]))

  console.log('Seeding equipment…')
  const clubEquipmentSeeds: Array<{
    slug: string
    items: Array<{
      nameFa: string
      nameEn: string
      price: number
      mode: 'PROVIDED' | 'RENTAL'
      stock?: number | null
      maxPerBooking?: number
    }>
  }> = [
    {
      slug: 'azadi-tennis',
      items: [
        { nameFa: 'راکت تنیس', nameEn: 'Tennis rackets', price: 80_000, mode: 'RENTAL', stock: 12, maxPerBooking: 2 },
        { nameFa: 'توپ تنیس', nameEn: 'Tennis balls', price: 0, mode: 'PROVIDED', stock: 30, maxPerBooking: 4 },
      ],
    },
    {
      slug: 'enghelab-tennis',
      items: [
        { nameFa: 'راکت تنیس', nameEn: 'Tennis rackets', price: 70_000, mode: 'RENTAL', stock: 8, maxPerBooking: 2 },
        { nameFa: 'توپ تنیس', nameEn: 'Tennis balls', price: 0, mode: 'PROVIDED', stock: 20, maxPerBooking: 4 },
      ],
    },
    {
      slug: 'padel-zone-tehran',
      items: [
        { nameFa: 'راکت پدل', nameEn: 'Padel rackets', price: 100_000, mode: 'RENTAL', stock: 10, maxPerBooking: 2 },
        { nameFa: 'توپ پدل', nameEn: 'Padel balls', price: 0, mode: 'PROVIDED', stock: 24, maxPerBooking: 4 },
      ],
    },
    {
      slug: 'green-turf-arena',
      items: [
        { nameFa: 'توپ فوتبال', nameEn: 'Footballs', price: 0, mode: 'PROVIDED', stock: 15, maxPerBooking: 2 },
        { nameFa: 'ساق‌بند', nameEn: 'Shin guards', price: 30_000, mode: 'RENTAL', stock: 20, maxPerBooking: 4 },
      ],
    },
    {
      slug: 'hoops-basketball-arena',
      items: [
        { nameFa: 'توپ بسکتبال', nameEn: 'Basketballs', price: 0, mode: 'PROVIDED', stock: 10, maxPerBooking: 2 },
      ],
    },
  ]
  for (const seed of clubEquipmentSeeds) {
    const club = clubBySlug[seed.slug]
    if (!club) continue
    for (const item of seed.items) {
      await prisma.courtAddon.create({ data: { clubId: club.id, ...item } })
    }
  }

  const coachEquipmentSeeds: Array<{
    coachId: string
    items: Array<{
      nameFa: string
      nameEn: string
      price: number
      mode: 'PROVIDED' | 'RENTAL'
      stock?: number | null
      maxPerBooking?: number
    }>
  }> = [
    {
      coachId: coachIds.sara,
      items: [
        { nameFa: 'راکت تنیس', nameEn: 'Tennis rackets', price: 0, mode: 'PROVIDED', stock: 6, maxPerBooking: 2 },
        { nameFa: 'توپ تنیس', nameEn: 'Tennis balls', price: 0, mode: 'PROVIDED', stock: 12, maxPerBooking: 4 },
      ],
    },
    {
      coachId: coachIds.maryam,
      items: [
        { nameFa: 'راکت پدل', nameEn: 'Padel rackets', price: 0, mode: 'PROVIDED' },
      ],
    },
    {
      coachId: coachIds.ali,
      items: [
        { nameFa: 'توپ فوتبال', nameEn: 'Footballs', price: 0, mode: 'PROVIDED' },
        { nameFa: 'چالیک', nameEn: 'Training cones', price: 0, mode: 'PROVIDED' },
      ],
    },
    {
      coachId: coachIds.sina,
      items: [
        { nameFa: 'توپ بسکتبال', nameEn: 'Basketballs', price: 0, mode: 'PROVIDED' },
      ],
    },
  ]
  for (const seed of coachEquipmentSeeds) {
    if (!seed.coachId) continue
    for (const item of seed.items) {
      await prisma.coachEquipment.create({ data: { coachId: seed.coachId, ...item } })
    }
  }

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
    { sport: 'tennis', city: 'تهران', day: 2, time: '18:00', max: 4, joined: 2, min: 'INTERMEDIATE', maxL: 'ADVANCED', notesFa: 'دو نفر جا داریم', notesEn: 'Looking for 2 more players' },
    { sport: 'padel', city: 'تهران', day: 3, time: '20:00', max: 4, joined: 3, min: 'BEGINNER', maxL: 'INTERMEDIATE', notesFa: 'بازی دوستانه', notesEn: 'Friendly doubles game' },
    { sport: 'football', city: 'تهران', day: 5, time: '19:00', max: 10, joined: 7, min: 'BEGINNER', maxL: 'PRO', notesFa: 'فوتبال ۵ نفره', notesEn: '5-a-side football' },
    { sport: 'fitness', city: 'تهران', day: 1, time: '07:30', max: 8, joined: 4, min: 'BEGINNER', maxL: 'INTERMEDIATE', notesFa: 'تمرین گروهی صبح', notesEn: 'Morning group workout' },
    { sport: 'yoga', city: 'تهران', day: 4, time: '08:00', max: 12, joined: 6, min: 'BEGINNER', maxL: 'PRO', notesFa: 'کلاس یوگای باز', notesEn: 'Open yoga session' },
    { sport: 'swim', city: 'تهران', day: 6, time: '10:00', max: 6, joined: 3, min: 'INTERMEDIATE', maxL: 'ADVANCED', notesFa: 'شنا آزاد — ۳ نفر جا داریم', notesEn: 'Lap swim — 3 spots open' },
    { sport: 'basketball', city: 'تهران', day: 7, time: '17:00', max: 10, joined: 6, min: 'INTERMEDIATE', maxL: 'PRO', notesFa: 'بسکتبال ۳ به ۳', notesEn: '3-on-3 basketball' },
    { sport: 'boxing', city: 'تهران', day: 8, time: '19:30', max: 4, joined: 2, min: 'BEGINNER', maxL: 'ADVANCED', notesFa: 'اسپarring سبک', notesEn: 'Light sparring session' },
  ]
  const seededMatchIds: string[] = []
  for (const [mi, ms] of matchSeeds.entries()) {
    const clubSlug = sportClubMap[ms.sport]
    const match = await prisma.openMatch.create({
      data: {
        sportId: sports[ms.sport],
        city: ms.city,
        clubId: clubBySlug[clubSlug]?.id,
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
    seededMatchIds.push(match.id)
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

  console.log('Seeding tournaments…')
  const tournamentSeeds = [
    {
      club: 'azadi-tennis',
      sport: 'tennis',
      titleFa: 'تورنمنت تنیس آخر هفته',
      titleEn: 'Weekend Tennis Tournament',
      descFa: 'مسابقه دو نفره آزاد — ثبت‌نام آنلاین',
      descEn: 'Open doubles tournament — register online',
      day: 8,
      time: '09:00',
      price: 350_000,
      max: 16,
      registrations: ['athlete', 'player2', 'player3', 'player4'] as const,
    },
    {
      club: 'padel-zone-tehran',
      sport: 'padel',
      titleFa: 'جام پدل تهران',
      titleEn: 'Tehran Padel Cup',
      descFa: 'مسابقه چهار نفره — سطح متوسط به بالا',
      descEn: 'Four-player bracket — intermediate and up',
      day: 10,
      time: '18:00',
      price: 420_000,
      max: 8,
      registrations: ['athlete', 'player2'] as const,
    },
    {
      club: 'green-turf-arena',
      sport: 'football',
      titleFa: 'جام فوتبال ۵ نفره',
      titleEn: '5-a-side Football Cup',
      descFa: 'مسابقه یک روزه — تیم‌های ۵ نفره',
      descEn: 'One-day 5-a-side tournament',
      day: 12,
      time: '16:00',
      price: 280_000,
      max: 10,
      registrations: [] as const,
    },
    {
      club: 'aqua-swim-center',
      sport: 'swim',
      titleFa: 'مسابقه شنا آزاد تابستان',
      titleEn: 'Summer Lap Swim Meet',
      descFa: 'مسابقه ۵۰ و ۱۰۰ متر — همه سطوح',
      descEn: '50m and 100m events — all levels welcome',
      day: 14,
      time: '08:00',
      price: 180_000,
      max: 24,
      registrations: [] as const,
    },
    {
      club: 'zen-yoga-studio',
      sport: 'yoga',
      titleFa: 'چالش یوگای ۳۰ روزه',
      titleEn: '30-Day Yoga Challenge',
      descFa: 'جلسات گروهی هفتگی — ریکاوری و انعطاف',
      descEn: 'Weekly group sessions — recovery and flexibility',
      day: 15,
      time: '07:00',
      price: 220_000,
      max: 20,
      registrations: [] as const,
    },
    {
      club: 'knockout-boxing-club',
      sport: 'boxing',
      titleFa: 'مسابقات بوکس آمateur',
      titleEn: 'Amateur Boxing Open',
      descFa: 'رده‌بندی وزنی — ثبت‌نام محدود',
      descEn: 'Weight-class brackets — limited entries',
      day: 18,
      time: '17:00',
      price: 300_000,
      max: 12,
      registrations: [] as const,
    },
  ]
  for (const ts of tournamentSeeds) {
    const regUserIds = ts.registrations.map((key) => demoUsers[key])
    await prisma.tournament.create({
      data: {
        titleFa: ts.titleFa,
        titleEn: ts.titleEn,
        descFa: ts.descFa,
        descEn: ts.descEn,
        date: isoDate(ts.day),
        startTime: ts.time,
        maxParticipants: ts.max,
        joinedCount: regUserIds.length,
        price: ts.price,
        status: regUserIds.length >= ts.max ? 'FULL' : 'OPEN',
        sportId: sports[ts.sport],
        clubId: clubBySlug[ts.club]!.id,
        registrations: {
          create: regUserIds.map((userId) => ({ userId })),
        },
      },
    })
  }

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
        bodyFa: n.bodyFa,
        bodyEn: n.bodyEn,
        coverUrl: demoImage.news(n.slug),
        date: isoDate(-newsSeeds.indexOf(n) - 1),
        sportId: n.sport ? sports[n.sport] : null,
      },
    })
  }

  console.log('Seeding reviews…')
  const reviewSeeds = [
    { club: 'azadi-tennis', userId: athlete.id, rating: 5, fa: 'رزرو فوق‌العاده ساده بود و زمین عالی. حتماً دوباره استفاده می‌کنم.', en: 'Booking was super simple and the court was great. Will definitely use again.' },
    { club: 'padel-zone-tehran', userId: extraPlayers[0].id, rating: 5, fa: 'بهترین راه برای پیدا کردن همبازی و رزرو زمین پدل. عاشقش شدم!', en: 'The best way to find partners and book a padel court. Loved it!' },
    { club: 'green-turf-arena', userId: extraPlayers[1].id, rating: 5, fa: 'بدون دردسر، بدون تماس تلفنی، فقط چند کلیک تا بازی.', en: 'No hassle, no phone calls, just a few clicks to play.' },
    { club: 'zen-yoga-studio', userId: extraPlayers[2].id, rating: 5, fa: 'برنامه لحظه‌ای و پرداخت در محل کار را خیلی راحت کرده.', en: 'Real-time schedule and pay-at-club made everything so easy.' },
    { club: 'iron-house-gym', userId: athlete.id, rating: 4, fa: 'تجربه روان و سریع. قیمت‌ها هم شفاف هستند.', en: 'Smooth and fast experience. Pricing is transparent too.' },
    { club: 'hoops-basketball-arena', userId: extraPlayers[0].id, rating: 5, fa: 'پیدا کردن زمین نزدیک خونه عالیه. پیشنهاد می‌کنم.', en: 'Finding a court near home is great. Highly recommend.' },
  ]
  for (const r of reviewSeeds) {
    await prisma.review.create({
      data: {
        rating: r.rating,
        bodyFa: r.fa,
        bodyEn: r.en,
        userId: r.userId,
        clubId: clubBySlug[r.club]?.id ?? null,
      },
    })
  }

  console.log('Seeding notifications…')
  const padelMatchId = seededMatchIds[1]
  await prisma.notification.createMany({
    data: [
      {
        userId: athlete.id,
        type: 'BOOKING',
        titleFa: 'رزرو شما تأیید شد',
        titleEn: 'Your booking is confirmed',
        bodyFa: 'مجموعه تنیس آزادی — فردا ساعت ۰۸:۰۰ تا ۱۰:۰۰',
        bodyEn: 'Azadi Tennis Complex — tomorrow 08:00–10:00',
        link: '/clubs/azadi-tennis',
      },
      {
        userId: athlete.id,
        type: 'MATCH',
        titleFa: 'به بازی عمومی پیوستید',
        titleEn: 'You joined an open match',
        bodyFa: 'بازی پدل در پدل زون تهران — فردا شب ساعت ۲۰:۰۰',
        bodyEn: 'Padel match at Padel Zone Tehran — tomorrow at 20:00',
        link: padelMatchId ? `/matches/${padelMatchId}` : '/matches',
      },
      {
        userId: athlete.id,
        type: 'SYSTEM',
        titleFa: 'به این باکس خوش آمدید',
        titleEn: 'Welcome to IN BOX S',
        bodyFa: 'پروفایل شما آماده است. اولین رزرو یا بازی عمومی را امتحان کنید.',
        bodyEn: 'Your profile is ready. Try your first booking or open match.',
        link: '/dashboard',
        readAt: new Date(),
      },
    ],
  })

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

  // Re-assert after club/court setup so demo logins reach dashboards (not onboarding)
  await prisma.user.updateMany({
    where: { email: { in: ['club@inboxs.local', 'coach@inboxs.local'] } },
    data: { onboardedAt: new Date() },
  })

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
    tournaments: await prisma.tournament.count(),
    tournamentRegs: await prisma.tournamentRegistration.count(),
    notifications: await prisma.notification.count(),
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
