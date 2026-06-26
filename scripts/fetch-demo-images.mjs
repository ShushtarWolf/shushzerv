#!/usr/bin/env node
/**
 * Downloads sport-themed demo photos into public/demo/ for offline use.
 * Club covers: loremflickr.com (Flickr CC photos by category).
 * News covers: curated Unsplash photos (3:1, matched to article title).
 *
 * Coach portraits (public/demo/coaches/) are AI-generated — not fetched here.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const demoDir = join(root, 'public', 'demo')

/** @param {string} tags comma-separated Flickr tags @param {number} w @param {number} h @param {number} [seed] */
function flickr(tags, w, h, seed = 1) {
  return `https://loremflickr.com/${w}/${h}/${tags}?random=${seed}`
}

const sportTags = {
  tennis: 'tennis,court',
  padel: 'padel,tennis',
  football: 'football,soccer',
  fitness: 'gym,fitness',
  yoga: 'yoga,studio',
  swim: 'swimming,pool',
  basketball: 'basketball,court',
  boxing: 'boxing,gym',
}

/** Curated Unsplash photos — stable sport-themed covers (not random Flickr) */
const clubImages = {
  'azadi-tennis': unsplash('photo-1622279457486-62dcc4a431d6', 1280, 720),
  'enghelab-tennis': unsplash('photo-1554068865-24cecd4e34b8', 1280, 720),
  'shiraz-tennis-academy': unsplash('photo-1595435934249-5df7ed325e1c', 1280, 720),
  'padel-zone-tehran': unsplash('photo-1646649853703-7645147474ba', 1280, 720),
  'isfahan-padel-club': unsplash('photo-1612872087720-bb876e2e67d1', 1280, 720),
  'green-turf-arena': unsplash('photo-1574629810360-7aef3d5f6be0', 1280, 720),
  'mashhad-football-center': unsplash('photo-1431324153459-4dbd91db81b0', 1280, 720),
  'tabriz-mini-football': unsplash('photo-1529900748604-07564a03e7a6', 1280, 720),
  'iron-house-gym': unsplash('photo-1534438327276-14e5300c3a48', 1280, 720),
  'isfahan-fit-club': unsplash('photo-1574680096145-d05b474e2155', 1280, 720),
  'zen-yoga-studio': unsplash('photo-1544367567-0f2fcb009e0b', 1280, 720),
  'shiraz-yoga-house': unsplash('photo-1506126613408-eca07ce68773', 1280, 720),
  'aqua-swim-center': unsplash('photo-1576013551627-0cc20b96c2a7', 1280, 720),
  'mashhad-aquatics': unsplash('photo-1519315901367-acbdca8685cc', 1280, 720),
  'hoops-basketball-arena': unsplash('photo-1546519638-68e109498ffc', 1280, 720),
  'knockout-boxing-club': unsplash('photo-1549719386-74dfdf717054', 1280, 720),
}

/** @param {string} photoId Unsplash photo id (e.g. photo-1554068865-24cecd4e34b8) */
function unsplash(photoId, w, h) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=80`
}

/** 3:1 landscape covers — each photo matches its seeded news title/topic */
const newsImages = {
  // «این باکس رسماً راه‌اندازی شد» — players on court / platform launch
  'in-box-s-launch': unsplash('photo-1646649852033-7e0f3d679f8b', 1200, 400),
  // «پدل؛ ورزش در حال رشد ایران» — blue padel court with racket
  'padel-rising': unsplash('photo-1646649853703-7645147474ba', 1200, 400),
  // «نکات تمرین در فصل سرد» — gym / strength training
  'winter-fitness-tips': unsplash('photo-1574680096145-d05b474e2155', 1200, 400),
  // «یوگا برای ورزشکاران» — yoga stretch
  'yoga-for-athletes': unsplash('photo-1544367567-0f2fcb009e0b', 1200, 400),
  // «فصل جدید سانس‌های شنا» — pool lanes
  'swimming-season': unsplash('photo-1576013551627-0cc20b96c2a7', 1200, 400),
  // «رزرو کن، در باشگاه پرداخت کن» — pay at counter
  'book-pay-at-club': unsplash('photo-1556742049-0cfed4f6a45d', 1200, 400),
}

async function download(url, dest, fallbackUrl) {
  let res = await fetch(url, { redirect: 'follow' })
  if (!res.ok && fallbackUrl) {
    console.log(`  ↻ retry ${dest.replace(root, '')}`)
    res = await fetch(fallbackUrl, { redirect: 'follow' })
  }
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, buf)
  console.log(`  ✓ ${dest.replace(root, '')}`)
}

/** @param {string} seed */
function picsum(seed, w, h) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

async function main() {
  console.log('Fetching demo images…')

  for (const [slug, url] of Object.entries(clubImages)) {
    await download(url, join(demoDir, 'clubs', `${slug}.jpg`), picsum(`club-${slug}`, 1280, 720))
  }

  for (const [slug, url] of Object.entries(newsImages)) {
    await download(url, join(demoDir, 'news', `${slug}.jpg`))
  }

  console.log(`Done — ${Object.keys(clubImages).length} clubs, ${Object.keys(newsImages).length} news covers (coach portraits are generated separately)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
