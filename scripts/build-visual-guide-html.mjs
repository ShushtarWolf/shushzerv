#!/usr/bin/env node
/**
 * Build public/docs/USER-GUIDE-VISUAL-FA.html from section data + screenshots.
 * Run: node scripts/build-visual-guide-html.mjs
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/docs/USER-GUIDE-VISUAL-FA.html')
const IMG = 'guide'

/** @type {Array<{id:string, title:string, intro:string, shots:Array<{file:string, caption?:string}>, steps?:string[], tips?:string[]}>} */
const sections = [
  {
    id: 'start',
    title: 'شروع سریع',
    intro: 'این باکس پلتفرم رزرو ورزشی است. آدرس فارسی: localhost:3000 — انگلیسی: /en',
    shots: [{ file: '01-home.png', caption: 'صفحهٔ اصلی — جستجو، ورزش‌ها، باشگاه‌ها، نقشه' }],
    steps: [
      'ثبت‌نام یا ورود با حساب آزمایشی (بخش ۱۹)',
      'از «شروع رزرو» یا نوار پایین «رزرو» وارد باشگاه‌ها شوید',
      'زمین و سانس را انتخاب و رزرو را تأیید کنید',
      'از داشبورد رزروها و برنامه را پیگیری کنید',
    ],
  },
  {
    id: 'mobile',
    title: 'نسخهٔ موبایل و نوار پایین',
    intro: 'در موبایل نوار پایین (Tab Bar) دسترسی سریع به خانه، کاوش، رزرو و داشبورد را می‌دهد.',
    shots: [
      { file: '17-mobile-home.png', caption: 'صفحهٔ اصلی موبایل' },
      { file: '18-mobile-clubs.png', caption: 'باشگاه‌ها در موبایل' },
    ],
    steps: [
      'خانه — بازگشت به صفحهٔ اصلی',
      'کاوش — مرور ورزش‌ها و شهرها',
      'رزرو — میانبر به /clubs?book=1',
      'داشبورد — پنل شخصی (پس از ورود)',
      'بیشتر — منوی کامل (مربیان، چت، اخبار)',
    ],
  },
  {
    id: 'auth',
    title: 'ثبت‌نام و ورود',
    intro: 'برای رزرو، کلاس و همبازی باید وارد حساب شوید. نقش در ثبت‌نام تعیین می‌شود.',
    shots: [
      { file: '10-login.png', caption: 'صفحهٔ ورود — ایمیل و رمز' },
      { file: '11-register.png', caption: 'ثبت‌نام — انتخاب نقش (ورزشکار / مربی / مدیر باشگاه)' },
      { file: '15-onboarding.png', caption: 'آنبوردینگ ورزشکار — ورزش و سطح مهارت' },
    ],
    steps: [
      'ورود: /login — پس از ورود به داشبورد نقش خود هدایت می‌شوید',
      'ثبت‌نام: /register — نام، ایمیل، رمز، نقش',
      'آنبوردینگ (ورزشکار): انتخاب ورزش‌های مورد علاقه و سطح',
    ],
    tips: ['حساب‌های دمو در بخش ۱۹ — رمز همه: demo1234'],
  },
  {
    id: 'home',
    title: 'صفحهٔ اصلی',
    intro: 'نقطهٔ شروع: جستجوی Hero، دسته ورزش‌ها، باشگاه‌های منتخب، کلاس، همبازی، نقشه.',
    shots: [{ file: '01-home.png', caption: 'اسکرول کنید: شهرها، نظرات، اخبار، CTA رزرو' }],
    steps: [
      '۱ — Hero: شهر + ورزش + «شروع رزرو»',
      '۲ — شبکه ورزش‌ها → صفحهٔ /sports/:slug',
      '۳ — کارت باشگاه → جزئیات باشگاه',
      '۴ — نقشهٔ کوچک → /clubs',
    ],
  },
  {
    id: 'explore',
    title: 'کاوش و صفحات ورزش',
    intro: 'کاوش محتوا را بر اساس گروه ورزشی فیلتر می‌کند.',
    shots: [
      { file: '02-explore.png', caption: 'صفحهٔ /explore' },
      { file: '12-sports-tennis.png', caption: 'صفحهٔ ورزش — مثال تنیس /sports/tennis' },
    ],
  },
  {
    id: 'clubs-map',
    title: 'باشگاه‌ها — نقشه و لیست',
    intro: 'مهم‌ترین بخش رزرو. دو نما: نقشه (Leaflet) و لیست کارت‌ها.',
    shots: [
      { file: '03b-clubs-list.png', caption: 'نمای لیست — کارت باشگاه با قیمت، امتیاز، تخفیف' },
      { file: '03-clubs-map-view.png', caption: 'نمای نقشه — پین‌های قیمت روی نقشه تهران' },
      { file: '03c-clubs-map-popup.png', caption: 'کلیک روی پین — پاپ‌آپ رزرو سریع از نقشه' },
    ],
    steps: [
      '۱ — بالای صفحه «نقشه / لیست» را عوض کنید',
      '۲ — فیلتر: شهر، ورزش، تاریخ، سرپوشیده/باز، مرتب‌سازی',
      '۳ — نقشه: روی حباب قیمت بزنید → پاپ‌آپ سانس',
      '۴ — لیست: «رزرو» یا کلیک کارت → صفحهٔ باشگاه',
      '۵ — بنر راهنما: باشگاه → زمین → سانس → تأیید',
    ],
    tips: ['روی پین نقشه مستقیم زمین، تاریخ و سانس آزاد را می‌بینید', '«نزدیک من» موقعیت GPS را می‌خواهد'],
  },
  {
    id: 'booking',
    title: 'رزرو زمین — گام‌به‌گام',
    intro: 'صفحهٔ باشگاه (/clubs/:slug) سه مرحله دارد: زمین → سانس → تأیید.',
    shots: [
      { file: '13-club-detail.png', caption: 'صفحهٔ باشگاه — انتخاب زمین (مرحله ۱)' },
      { file: '14b-club-slot-picked-auth.png', caption: 'انتخاب سانس آزاد (مرحله ۲)' },
      { file: '14c-booking-success.png', caption: 'تأیید رزرو موفق (مرحله ۳)' },
    ],
    steps: [
      '۱ — یک زمین (Court) انتخاب کنید — دکمهٔ سبز',
      '۲ — هفته را با فلش‌ها جابه‌جا کنید؛ «امروز» برای برگشت',
      '۳ — روی سانس «آزاد» (خاکستری) بزنید',
      '۴ — خلاصه: باشگاه، زمین، تاریخ، ساعت، قیمت',
      '۵ — «پرداخت با کیف پول» یا «پرداخت در محل باشگاه»',
      '۶ — پس از موفقیت: مشاهده رزروها یا ساخت همبازی',
    ],
    tips: ['بدون ورود، دکمهٔ تأیید به صفحهٔ login می‌برد', 'لغو از داشبورد → تب رزروها'],
  },
  {
    id: 'classes',
    title: 'کلاس‌های گروهی',
    intro: 'ثبت‌نام در کلاس با مربی — از /classes یا صفحهٔ باشگاه.',
    shots: [
      { file: '04-classes.png', caption: 'لیست کلاس‌ها' },
      { file: '04b-class-detail-full.png', caption: 'جزئیات کلاس — ثبت‌نام، ظرفیت، قیمت' },
    ],
    steps: ['«ثبت‌نام» → پرداخت کیف پول یا در محل', 'مدیریت: داشبورد → ثبت‌نام کلاس‌ها'],
  },
  {
    id: 'matches',
    title: 'همبازی (بازی باز)',
    intro: 'بازی باز بسازید یا به بازی دیگران بپیوندید. لینک اشتراک: /m/:token',
    shots: [
      { file: '05-matches.png', caption: 'لیست بازی‌های باز' },
      { file: '05b-match-detail.png', caption: 'جزئیات بازی — پیوستن، سطح، بازیکنان' },
    ],
    steps: ['«ایجاد بازی» — ورزش، شهر، تاریخ، سطح', '«پیوستن» — اگر جا باشد', 'لینک را برای دوستان بفرستید'],
  },
  {
    id: 'coaches',
    title: 'مربیان',
    intro: 'پروفایل مربی، رزرو جلسه، برنامه تمرینی از داشبورد مربی.',
    shots: [
      { file: '06-coaches.png', caption: 'لیست مربیان' },
      { file: '06b-coach-detail.png', caption: 'پروفایل مربی — رزرو جلسه' },
    ],
  },
  {
    id: 'tournaments',
    title: 'مسابقات',
    intro: 'تورنمنت‌های باشگاه — ثبت‌نام از /tournaments',
    shots: [
      { file: '07-tournaments.png', caption: 'لیست مسابقات' },
      { file: '07b-tournament-detail.png', caption: 'جزئیات و ثبت‌نام' },
    ],
  },
  {
    id: 'chat-news',
    title: 'چت، اخبار و درباره',
    intro: 'پیام‌ها پس از همبازی؛ اخبار ورزشی؛ صفحهٔ درباره.',
    shots: [
      { file: '16-chat.png', caption: 'پیام‌ها /chat' },
      { file: '08-news.png', caption: 'اخبار /news' },
      { file: '09-about.png', caption: 'درباره /about' },
    ],
  },
  {
    id: 'dash-athlete',
    title: 'داشبورد ورزشکار',
    intro: 'مسیر: /dashboard — ۷ تب در منوی کناری.',
    shots: [
      { file: '20-dash-athlete-overview.png', caption: 'خلاصه — آمار، نمودار، XP، نشان' },
      { file: '21-dash-athlete-schedule.png', caption: 'برنامه — تقویم یکپارچه' },
      { file: '22-dash-athlete-bookings.png', caption: 'رزروها — پیش‌رو، گذشته، نظر' },
      { file: '23-dash-athlete-wallet.png', caption: 'کیف پول — شارژ و تراکنش' },
      { file: '24-dash-athlete-profile.png', caption: 'پروفایل — زبان، ورزش، push، سطح' },
    ],
    steps: [
      'خلاصه: اقدامات سریع — رزرو، کیف پول، برنامه، همبازی',
      'برنامه: کلیک رویداد → جزئیات کلاس/مسابقه/رزرو',
      'رزروها: لغو رزرو؛ ثبت نظر برای باشگاه',
      'برنامه‌ها: تمرین/غذایی مربی — تیک انجام شد',
    ],
  },
  {
    id: 'dash-club',
    title: 'داشبورد مدیر باشگاه',
    intro: 'مسیر: /dashboard/club — باشگاه را از منوی بالا انتخاب کنید.',
    shots: [
      { file: '30-dash-club-overview.png', caption: 'خلاصه درآمد و نمودار' },
      { file: '31-dash-club-schedule.png', caption: 'برنامه — ثبت مشتری حضوری روی سانس' },
      { file: '32-dash-club-manage.png', caption: 'مدیریت — زمین، سانس، کلاس، رویداد' },
      { file: '33-dash-club-bookings.png', caption: 'رزروهای دریافتی — تأیید پرداخت' },
    ],
    steps: [
      'مدیریت: افزودن زمین → تنظیم سانس → ایجاد سانس روزانه',
      'برنامه: کلیک سانس آزاد → نام مشتری یا ایمیل',
      'رزروها: تأیید «پرداخت در محل»',
      'مالی: خروجی CSV',
    ],
  },
  {
    id: 'dash-coach',
    title: 'داشبورد مربی',
    intro: 'مسیر: /dashboard/coach',
    shots: [
      { file: '40-dash-coach-overview.png', caption: 'خلاصه درآمد و شاگردان' },
      { file: '41-dash-coach-plans.png', caption: 'برنامه‌ها — ایجاد و اختصاص به ورزشکار' },
    ],
  },
  {
    id: 'dash-admin',
    title: 'داشبورد مدیر پلتفرم',
    intro: 'مسیر: /dashboard/admin — مدیریت کل سیستم.',
    shots: [
      { file: '50-dash-admin-overview.png', caption: 'KPI پلتفرم و نمودار ۶ ماهه' },
      { file: '51-dash-admin-users.png', caption: 'کاربران — نقش، تعلیق، جستجو' },
    ],
  },
  {
    id: 'demo',
    title: 'حساب‌های آزمایشی',
    intro: 'رمز همه: demo1234 — پس از npm run db:seed',
    shots: [],
    steps: [],
  },
]

const demoTable = `
<table class="demo-table">
  <tr><th>نقش</th><th>ایمیل</th><th>داشبورد</th></tr>
  <tr><td>ورزشکار</td><td><code>athlete@inboxs.local</code></td><td><code>/dashboard</code></td></tr>
  <tr><td>مربی</td><td><code>coach@inboxs.local</code></td><td><code>/dashboard/coach</code></td></tr>
  <tr><td>مدیر باشگاه</td><td><code>club@inboxs.local</code></td><td><code>/dashboard/club</code></td></tr>
  <tr><td>مدیر پلتفرم</td><td><code>admin@inboxs.local</code></td><td><code>/dashboard/admin</code></td></tr>
</table>`

function renderSection(s, i) {
  const shotsHtml = s.shots
    .map(
      (sh) => `
    <figure class="shot">
      <img src="${IMG}/${sh.file}" alt="${sh.caption || s.title}" loading="lazy" />
      <figcaption>${sh.caption || ''}</figcaption>
    </figure>`,
    )
    .join('')

  const stepsHtml = s.steps?.length
    ? `<ol class="steps">${s.steps.map((st) => `<li>${st}</li>`).join('')}</ol>`
    : ''

  const tipsHtml = s.tips?.length
    ? `<div class="tip">${s.tips.map((t) => `<p>💡 ${t}</p>`).join('')}</div>`
    : ''

  const extra = s.id === 'demo' ? demoTable : ''

  return `
<section id="${s.id}" class="guide-section">
  <div class="section-head">
    <span class="section-num">${String(i + 1).padStart(2, '0')}</span>
    <h2>${s.title}</h2>
  </div>
  <p class="intro">${s.intro}</p>
  ${stepsHtml}
  ${tipsHtml}
  ${extra}
  <div class="shots ${s.shots.length > 1 ? 'shots-grid' : ''}">${shotsHtml}</div>
</section>`
}

const toc = sections
  .map((s, i) => `<li><a href="#${s.id}"><span>${String(i + 1).padStart(2, '0')}</span> ${s.title}</a></li>`)
  .join('')

const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>این باکس — راهنمای تصویری کامل</title>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      --orange: #ff5a1f;
      --green: #22c55e;
      --navy: #2c4a6e;
      --ink: #1a1a1a;
      --muted: #64748b;
      --border: #e2e8f0;
      --bg: #f8fafc;
      --card: #fff;
      --sidebar: 17rem;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.7;
    }
    .layout { display: flex; min-height: 100vh; }
    .sidebar {
      position: fixed;
      top: 0; right: 0;
      width: var(--sidebar);
      height: 100vh;
      overflow-y: auto;
      background: var(--card);
      border-left: 1px solid var(--border);
      padding: 1.25rem 1rem;
      z-index: 100;
    }
    .sidebar h1 {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--navy);
      margin: 0 0 .25rem;
    }
    .sidebar .sub { font-size: .75rem; color: var(--muted); margin-bottom: 1rem; }
    .sidebar nav ol { list-style: none; padding: 0; margin: 0; }
    .sidebar nav a {
      display: block;
      padding: .45rem .6rem;
      border-radius: .5rem;
      color: var(--ink);
      text-decoration: none;
      font-size: .82rem;
      font-weight: 500;
    }
    .sidebar nav a:hover { background: #fff3ed; color: var(--orange); }
    .sidebar nav span { color: var(--orange); font-weight: 700; margin-left: .35rem; }
    .main {
      margin-right: var(--sidebar);
      flex: 1;
      padding: 1.5rem 2rem 3rem;
      max-width: 960px;
    }
    .hero {
      background: linear-gradient(135deg, var(--navy), #1e3a5f);
      color: #fff;
      border-radius: 1.25rem;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .hero h2 { margin: 0 0 .5rem; font-size: 1.75rem; font-weight: 800; }
    .hero p { margin: 0; opacity: .9; }
    .badge {
      display: inline-block;
      background: var(--orange);
      padding: .25rem .75rem;
      border-radius: 999px;
      font-size: .75rem;
      font-weight: 700;
      margin-top: 1rem;
    }
    .guide-section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      scroll-margin-top: 1rem;
    }
    .section-head { display: flex; align-items: center; gap: .75rem; margin-bottom: .75rem; }
    .section-num {
      background: var(--orange);
      color: #fff;
      font-weight: 800;
      font-size: .85rem;
      width: 2rem; height: 2rem;
      border-radius: .5rem;
      display: flex; align-items: center; justify-content: center;
    }
    .guide-section h2 { margin: 0; font-size: 1.25rem; color: var(--navy); }
    .intro { color: var(--muted); margin: 0 0 1rem; }
    ol.steps { padding-right: 1.25rem; margin: 0 0 1rem; }
    ol.steps li { margin: .35rem 0; }
    .tip {
      background: #fff8f5;
      border-right: 4px solid var(--orange);
      padding: .75rem 1rem;
      border-radius: .5rem;
      margin-bottom: 1rem;
      font-size: .9rem;
    }
    .tip p { margin: .25rem 0; }
    .shots { margin-top: 1rem; }
    .shots-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
    figure.shot { margin: 0; }
    figure.shot img {
      width: 100%;
      border-radius: .75rem;
      border: 1px solid var(--border);
      box-shadow: 0 4px 20px rgba(0,0,0,.08);
    }
    figcaption {
      font-size: .8rem;
      color: var(--muted);
      margin-top: .5rem;
      text-align: center;
    }
    table.demo-table {
      width: 100%;
      border-collapse: collapse;
      font-size: .85rem;
      margin: 1rem 0;
    }
    table.demo-table th, table.demo-table td {
      border: 1px solid var(--border);
      padding: .5rem .75rem;
      text-align: right;
    }
    table.demo-table th { background: var(--bg); }
    code {
      background: #f1f5f9;
      padding: .1rem .35rem;
      border-radius: .25rem;
      font-size: .8rem;
      direction: ltr;
      display: inline-block;
    }
    .footer {
      text-align: center;
      color: var(--muted);
      font-size: .8rem;
      padding: 2rem 0;
    }
    @media (max-width: 900px) {
      .sidebar { display: none; }
      .main { margin-right: 0; padding: 1rem; }
    }
    @media print {
      .sidebar { display: none; }
      .main { margin: 0; max-width: none; }
      .guide-section { break-inside: avoid; page-break-inside: avoid; }
      figure.shot img { max-height: 420px; object-fit: contain; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <h1>این باکس</h1>
      <p class="sub">راهنمای تصویری · ${sections.length} بخش · ${sections.reduce((n, s) => n + s.shots.length, 0)} تصویر</p>
      <nav><ol>${toc}</ol></nav>
    </aside>
    <main class="main">
      <header class="hero">
        <h2>راهنمای تصویری کامل وب‌سایت</h2>
        <p>هر صفحه با اسکرین‌شات واقعی و توضیح گام‌به‌گام — رزرو از نقشه، داشبوردها، موبایل و حساب‌های دمو.</p>
        <span class="badge">به‌روزرسانی: ژوئن ۲۰۲۶</span>
      </header>
      ${sections.map(renderSection).join('')}
      <p class="footer">این باکس · برای تازه‌سازی تصاویر: <code>npm run guide:screenshots</code></p>
    </main>
  </div>
</body>
</html>`

writeFileSync(OUT, html, 'utf8')
console.log('Written:', OUT)
