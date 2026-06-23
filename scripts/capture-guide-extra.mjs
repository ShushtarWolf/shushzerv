/** Extra guide screenshots: map popup, detail pages, booking confirm */
import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../public/docs/guide')
const BASE = process.env.BASE_URL || 'http://localhost:3000'

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: name.includes('full') })
  console.log('✓', name)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ locale: 'fa-IR', viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()

  await page.goto(`${BASE}/clubs`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'نقشه' }).click()
  await page.waitForTimeout(3000)
  await shot(page, '03-clubs-map-view')

  const pin = page.locator('.club-map-pin').first()
  if (await pin.count()) {
    await pin.click({ force: true })
    await page.waitForTimeout(1000)
    await shot(page, '03c-clubs-map-popup')
  }

  await page.goto(`${BASE}/classes`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const classLink = page.locator('a[href*="/classes/"]').first()
  if (await classLink.count()) {
    await classLink.click()
    await page.waitForTimeout(1000)
    await shot(page, '04b-class-detail-full')
  }

  await page.goto(`${BASE}/matches`, { waitUntil: 'networkidle' })
  const matchLink = page.locator('a[href*="/matches/"]').first()
  if (await matchLink.count()) {
    await matchLink.click()
    await page.waitForTimeout(1000)
    await shot(page, '05b-match-detail')
  }

  await page.goto(`${BASE}/coaches`, { waitUntil: 'networkidle' })
  const coachLink = page.locator('a[href*="/coaches/"]').first()
  if (await coachLink.count()) {
    await coachLink.click()
    await page.waitForTimeout(1000)
    await shot(page, '06b-coach-detail')
  }

  await page.goto(`${BASE}/tournaments`, { waitUntil: 'networkidle' })
  const tLink = page.locator('a[href*="/tournaments/"]').first()
  if (await tLink.count()) {
    await tLink.click()
    await page.waitForTimeout(1000)
    await shot(page, '07b-tournament-detail')
  }

  await page.goto(`${BASE}/clubs/azadi-tennis`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  const availSlot = page.locator('button').filter({ hasText: /^[\d۰-۹]/ }).first()
  if (await availSlot.count()) {
    await availSlot.click()
    await page.waitForTimeout(500)
    await shot(page, '14b-club-slot-picked')
  }
  const confirmBtn = page.getByRole('button', { name: /تأیید|تایید|رزرو/ }).first()
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click().catch(() => {})
    await page.waitForTimeout(800)
    await shot(page, '14c-booking-confirm')
  }

  await browser.close()
  console.log('Extra shots done')
}

main().catch(console.error)
