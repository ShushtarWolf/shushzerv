/**
 * Capture guide screenshots via Playwright.
 * Run: npx playwright install chromium && node scripts/capture-guide-screenshots.mjs
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'public/docs/guide')
const BASE = process.env.BASE_URL || 'http://localhost:3000'

async function shot(page, name, opts = {}) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({
    path: file,
    fullPage: opts.fullPage ?? false,
    ...opts,
  })
  console.log('  ✓', name)
}

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill('demo1234')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  await page.waitForTimeout(800)
}

async function dashTab(page, tab, name) {
  const url = tab ? `${BASE}/dashboard?tab=${tab}` : `${BASE}/dashboard`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await shot(page, name)
}

async function main() {
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    locale: 'fa-IR',
    viewport: { width: 1280, height: 800 },
  })
  const page = await ctx.newPage()

  console.log('Public pages…')
  for (const [name, url, fullPage] of [
    ['01-home', '/', true],
    ['02-explore', '/explore', true],
    ['04-classes', '/classes', true],
    ['05-matches', '/matches', true],
    ['06-coaches', '/coaches', true],
    ['07-tournaments', '/tournaments', true],
    ['08-news', '/news', true],
    ['09-about', '/about', false],
    ['10-login', '/login', false],
    ['11-register', '/register', false],
    ['12-sports-tennis', '/sports/tennis', true],
  ]) {
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await shot(page, name, { fullPage })
  }

  console.log('Clubs map & list…')
  await page.goto(`${BASE}/clubs`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await shot(page, '03-clubs-map')

  const listBtn = page.getByRole('button', { name: /لیست|list/i }).first()
  if (await listBtn.isVisible().catch(() => false)) {
    await listBtn.click()
    await page.waitForTimeout(800)
  }
  await shot(page, '03b-clubs-list', { fullPage: true })

  console.log('Club booking…')
  await page.goto(`${BASE}/clubs/azadi-tennis`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await shot(page, '13-club-detail', { fullPage: true })

  const slot = page.locator('[data-slot-id], .schedule-slot, button').filter({ hasText: /^\d/ }).first()
  if (await slot.count() > 0) {
    await slot.click().catch(() => {})
    await page.waitForTimeout(600)
  }
  await shot(page, '14-club-slot-selected')

  await login(page, 'athlete@shushzerv.local')
  console.log('Athlete dashboard…')
  await dashTab(page, undefined, '20-dash-athlete-overview')
  await dashTab(page, 'schedule', '21-dash-athlete-schedule')
  await dashTab(page, 'bookings', '22-dash-athlete-bookings')
  await dashTab(page, 'wallet', '23-dash-athlete-wallet')
  await dashTab(page, 'profile', '24-dash-athlete-profile')

  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await shot(page, '15-onboarding')

  await page.goto(`${BASE}/chat`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await shot(page, '16-chat')

  const mobile = await browser.newContext({
    locale: 'fa-IR',
    viewport: { width: 390, height: 844 },
    isMobile: true,
  })
  const mpage = await mobile.newPage()
  await mpage.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await mpage.waitForTimeout(1000)
  await shot(mpage, '17-mobile-home')
  await mpage.goto(`${BASE}/clubs?book=1`, { waitUntil: 'networkidle' })
  await mpage.waitForTimeout(2000)
  await shot(mpage, '18-mobile-clubs')

  await browser.close()

  const b2 = await chromium.launch({ headless: true })
  const cClub = await b2.newContext({ locale: 'fa-IR', viewport: { width: 1280, height: 800 } })
  const pClub = await cClub.newPage()
  await login(pClub, 'club@shushzerv.local')
  await pClub.goto(`${BASE}/dashboard/club`, { waitUntil: 'networkidle' })
  await pClub.waitForTimeout(1500)
  await shot(pClub, '30-dash-club-overview')
  await pClub.goto(`${BASE}/dashboard/club?tab=schedule`, { waitUntil: 'networkidle' })
  await pClub.waitForTimeout(2000)
  await shot(pClub, '31-dash-club-schedule')
  await pClub.goto(`${BASE}/dashboard/club?tab=manage`, { waitUntil: 'networkidle' })
  await pClub.waitForTimeout(1000)
  await shot(pClub, '32-dash-club-manage')
  await pClub.goto(`${BASE}/dashboard/club?tab=bookings`, { waitUntil: 'networkidle' })
  await pClub.waitForTimeout(1000)
  await shot(pClub, '33-dash-club-bookings')

  const cCoach = await b2.newContext({ locale: 'fa-IR', viewport: { width: 1280, height: 800 } })
  const pCoach = await cCoach.newPage()
  await login(pCoach, 'coach@shushzerv.local')
  await pCoach.goto(`${BASE}/dashboard/coach`, { waitUntil: 'networkidle' })
  await pCoach.waitForTimeout(1200)
  await shot(pCoach, '40-dash-coach-overview')
  await pCoach.goto(`${BASE}/dashboard/coach?tab=plans`, { waitUntil: 'networkidle' })
  await pCoach.waitForTimeout(800)
  await shot(pCoach, '41-dash-coach-plans')

  const cAdmin = await b2.newContext({ locale: 'fa-IR', viewport: { width: 1280, height: 800 } })
  const pAdmin = await cAdmin.newPage()
  await login(pAdmin, 'admin@shushzerv.local')
  await pAdmin.goto(`${BASE}/dashboard/admin`, { waitUntil: 'networkidle' })
  await pAdmin.waitForTimeout(1200)
  await shot(pAdmin, '50-dash-admin-overview')
  await pAdmin.goto(`${BASE}/dashboard/admin?tab=users`, { waitUntil: 'networkidle' })
  await pAdmin.waitForTimeout(800)
  await shot(pAdmin, '51-dash-admin-users')

  await b2.close()
  console.log('\nDone →', OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
