#!/usr/bin/env node
/**
 * UI/UX HTML audit — SSR sidebar labels, demo login, dashboard tabs, public pages.
 * Complements browser QA; run against local or production.
 *
 * Usage: BASE_URL=http://127.0.0.1:3002 node scripts/ui-visual-audit.mjs
 */
const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')

const DEMO = {
  ATHLETE: { email: 'athlete@inboxs.local', password: 'demo1234' },
  COACH: { email: 'coach@inboxs.local', password: 'demo1234' },
  CLUB_ADMIN: { email: 'club@inboxs.local', password: 'demo1234' },
  PLATFORM_ADMIN: { email: 'admin@inboxs.local', password: 'demo1234' },
}

const DASHBOARD_SIDEBAR = {
  '/dashboard': { groups: ['عمومی', 'حساب'], tabs: ['خلاصه', 'برنامه', 'رزروها'] },
  '/dashboard/coach': { groups: ['عمومی', 'کسب‌وکار', 'حساب'], tabs: ['خلاصه', 'جلسات', 'برنامه'] },
  '/dashboard/club': { groups: ['عمومی', 'عملیات', 'حساب', 'کسب‌وکار'], tabs: ['خلاصه', 'برنامه', 'رزروها'] },
  '/dashboard/admin': { groups: ['عمومی', 'مدیریت', 'عملیات'], tabs: ['خلاصه', 'کاربران', 'باشگاه‌ها'] },
}

let passed = 0
let failed = 0

function ok(label) {
  passed++
  console.log(`  ✓ ${label}`)
}

function fail(label, detail = '') {
  failed++
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
}

function parseCookies(res) {
  const raw = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean)
  return raw.flatMap((l) => (Array.isArray(l) ? l : [l])).map((c) => c.split(';')[0]).join('; ')
}

async function login(role) {
  const creds = DEMO[role]
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(creds),
  })
  if (!res.ok) throw new Error(`${role} login HTTP ${res.status}`)
  return parseCookies(res)
}

async function logout(cookie) {
  await fetch(`${BASE}/api/auth/logout`, { method: 'POST', headers: { cookie } })
}

async function fetchHtml(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { cookie, Accept: 'text/html' },
    redirect: 'manual',
  })
  return { status: res.status, html: await res.text() }
}

function assertSidebar(html, { groups, tabs }, label) {
  if (/admin-nav-group">\s*[0-3]\s*</.test(html)) {
    fail(`${label} sidebar has numeric group labels (Map v-for bug)`)
    return false
  }
  let okAll = true
  for (const g of groups) {
    if (!html.includes(`admin-nav-group">${g}</p>`) && !html.includes(`admin-nav-group">${g}<`)) {
      fail(`${label} missing sidebar group "${g}"`)
      okAll = false
    }
  }
  for (const t of tabs) {
    if (!html.includes(`>${t}<`)) {
      fail(`${label} missing sidebar tab "${t}"`)
      okAll = false
    }
  }
  if (okAll) ok(`${label} sidebar SSR labels`)
  return okAll
}

async function main() {
  console.log(`UI visual audit → ${BASE}\n`)

  // Demo logins must work (production demo was broken before entrypoint fix)
  for (const [role, creds] of Object.entries(DEMO)) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(creds),
    })
    if (res.ok) ok(`demo login ${role}`)
    else fail(`demo login ${role}`, `HTTP ${res.status}`)
  }

  // Public pages render key content
  for (const [path, needle] of [
    ['/', 'زمین رزرو کن'],
    ['/clubs', 'azadi-tennis'],
    ['/clubs/azadi-tennis', 'رزرو'],
    ['/login', 'ورود'],
    ['/register', 'ثبت'],
  ]) {
    const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'text/html' } })
    const html = await res.text()
    if (res.ok && html.includes(needle)) ok(`GET ${path} contains "${needle}"`)
    else fail(`GET ${path} contains "${needle}"`, `status=${res.status}`)
  }

  // Dashboard sidebars per role
  const roleByPath = {
    '/dashboard': 'ATHLETE',
    '/dashboard/coach': 'COACH',
    '/dashboard/club': 'CLUB_ADMIN',
    '/dashboard/admin': 'PLATFORM_ADMIN',
  }

  for (const [path, spec] of Object.entries(DASHBOARD_SIDEBAR)) {
    const role = roleByPath[path]
    let cookie
    try {
      cookie = await login(role)
    } catch (e) {
      fail(`${path} sidebar audit`, e.message)
      continue
    }
    const { status, html } = await fetchHtml(path, cookie)
    if (status !== 200) {
      fail(`GET ${path}`, `HTTP ${status}`)
    } else {
      assertSidebar(html, spec, path)
    }
    await logout(cookie)
  }

  // Tab deep-link renders correct section heading (club bookings)
  try {
    const cookie = await login('CLUB_ADMIN')
    const { html } = await fetchHtml('/dashboard/club?tab=bookings', cookie)
    if (html.includes('رزروهای دریافتی')) ok('club ?tab=bookings SSR heading')
    else fail('club ?tab=bookings SSR heading', 'missing رزروهای دریافتی')
    await logout(cookie)
  } catch (e) {
    fail('club tab deep-link', e.message)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
