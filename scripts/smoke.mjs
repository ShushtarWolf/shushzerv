#!/usr/bin/env node
/**
 * Shushzerv smoke checks — run against a live server (dev or production preview).
 *
 * Usage:
 *   npm run dev          # terminal 1
 *   npm run smoke        # terminal 2
 *
 *   BASE_URL=http://127.0.0.1:3000 npm run smoke
 */

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const SCHEDULE_SLUG = process.env.SMOKE_CLUB_SLUG ?? 'azadi-tennis'
const SCHEDULE_BUDGET_MS = Number(process.env.SMOKE_SCHEDULE_MS ?? 2000)

const DEMO_ACCOUNTS = [
  { role: 'ATHLETE', email: 'athlete@shushzerv.local', password: 'demo1234' },
  { role: 'COACH', email: 'coach@shushzerv.local', password: 'demo1234' },
  { role: 'CLUB_ADMIN', email: 'club@shushzerv.local', password: 'demo1234' },
  { role: 'PLATFORM_ADMIN', email: 'admin@shushzerv.local', password: 'demo1234' },
]

const ROLE_EXPECTED = {
  ATHLETE: 'ATHLETE',
  COACH: 'COACH',
  CLUB_ADMIN: 'CLUB_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
}

/** Required chart payload keys per role (matches dashboard pages + shared/dashboardCharts.ts). */
const CHART_FIELDS = {
  ATHLETE: ['labels', 'spending', 'bookingTrend', 'classTrend', 'matchTrend', 'breakdown'],
  COACH: ['labels', 'earnings', 'sessionTrend', 'breakdown'],
  CLUB_ADMIN: ['labels', 'revenue', 'bookingTrend', 'classTrend', 'dowLabels', 'bookingByDow', 'classByDow', 'breakdown'],
  PLATFORM_ADMIN: ['labels', 'users', 'clubs', 'bookings', 'fees'],
}

function hasChartFields(role, body) {
  const keys = CHART_FIELDS[role]
  if (!keys) return { ok: false, detail: `unknown role ${role}` }
  const missing = keys.filter((k) => body?.[k] === undefined)
  if (missing.length) return { ok: false, detail: `missing: ${missing.join(', ')}` }
  return { ok: true }
}

let failed = 0

function pass(label) {
  console.log(`  ✓ ${label}`)
}

function fail(label, detail = '') {
  failed += 1
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
}

function localDateISO(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

/** FA week start (matches useScheduleWeek). */
function weekRange(locale = 'fa') {
  const anchor = localDateISO()
  const d = new Date(`${anchor}T12:00:00`)
  const day = d.getDay()
  const diff = locale === 'fa' ? (day + 1) % 7 : day
  d.setDate(d.getDate() - diff)
  const start = localDateISO(d)
  const endDate = new Date(d)
  endDate.setDate(endDate.getDate() + 6)
  return { from: start, to: localDateISO(endDate) }
}

function parseCookies(res) {
  const raw = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean)
  return raw
    .flatMap((line) => (Array.isArray(line) ? line : [line]))
    .filter(Boolean)
    .map((c) => c.split(';')[0])
    .join('; ')
}

async function request(path, { method = 'GET', body, cookie, label } = {}) {
  const url = `${BASE_URL}${path}`
  const headers = { Accept: 'application/json' }
  if (body) headers['Content-Type'] = 'application/json'
  if (cookie) headers.Cookie = cookie

  const started = performance.now()
  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    })
  } catch (err) {
    fail(label ?? path, `network error: ${err.message}`)
    return { ok: false, status: 0, ms: performance.now() - started }
  }

  const ms = performance.now() - started
  let json
  const text = await res.text()
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }

  return { ok: res.ok, status: res.status, json, ms, cookie: parseCookies(res) }
}

async function login(account) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: { email: account.email, password: account.password },
    label: `login ${account.role}`,
  })
  if (res.status !== 200) {
    fail(`POST /api/auth/login (${account.role})`, `HTTP ${res.status}`)
    return null
  }
  if (!res.cookie) {
    fail(`POST /api/auth/login (${account.role})`, 'no session cookie')
    return null
  }
  pass(`POST /api/auth/login (${account.role}) → 200`)
  return res.cookie
}

async function phase1Api() {
  console.log('\nPhase 1 — Public & dashboard API')

  const tournaments = await request('/api/tournaments', { label: 'GET /api/tournaments' })
  if (tournaments.status === 200 && Array.isArray(tournaments.json) && tournaments.json.length > 0) {
    pass(`GET /api/tournaments → 200 (${tournaments.json.length} items)`)
  } else {
    fail('GET /api/tournaments → non-empty', `HTTP ${tournaments.status}, count=${Array.isArray(tournaments.json) ? tournaments.json.length : 'n/a'}`)
  }

  for (const account of DEMO_ACCOUNTS) {
    const cookie = await login(account)
    if (!cookie) continue

    const charts = await request('/api/dashboard/charts', { cookie, label: `charts ${account.role}` })
    if (charts.status !== 200) {
      fail(`GET /api/dashboard/charts (${account.role})`, `HTTP ${charts.status}`)
      continue
    }
    const expected = ROLE_EXPECTED[account.role]
    if (charts.json?.role === expected) {
      const fields = hasChartFields(account.role, charts.json)
      if (fields.ok) {
        pass(`GET /api/dashboard/charts (${account.role}) → 200 role=${expected}`)
      } else {
        fail(`GET /api/dashboard/charts (${account.role}) fields`, fields.detail)
      }
    } else {
      fail(`GET /api/dashboard/charts (${account.role})`, `expected role ${expected}, got ${charts.json?.role}`)
    }

    await request('/api/auth/logout', { method: 'POST', cookie })
  }
}

async function phase2Schedule() {
  console.log('\nPhase 2 — Club schedule (first-paint proxy)')

  const started = performance.now()
  const club = await request(`/api/clubs/${SCHEDULE_SLUG}`, { label: 'club detail' })
  if (club.status !== 200 || !club.json?.courts?.length) {
    fail(`GET /api/clubs/${SCHEDULE_SLUG}`, `HTTP ${club.status} or no courts`)
    return
  }

  const courtId = club.json.courts[0].id
  const { from, to } = weekRange('fa')
  const schedule = await request(
    `/api/clubs/${SCHEDULE_SLUG}/schedule?from=${from}&to=${to}&courtId=${courtId}`,
    { label: 'club schedule' },
  )
  const totalMs = performance.now() - started

  if (schedule.status !== 200) {
    fail('club schedule fetch', `HTTP ${schedule.status}`)
    return
  }

  const events = schedule.json?.events ?? []
  if (!events.length) {
    fail('club schedule events', 'empty events array (run npm run db:seed)')
    return
  }

  if (totalMs <= SCHEDULE_BUDGET_MS) {
    pass(`club + schedule within ${SCHEDULE_BUDGET_MS}ms (${Math.round(totalMs)}ms, ${events.length} events)`)
  } else {
    fail(`club schedule within ${SCHEDULE_BUDGET_MS}ms`, `${Math.round(totalMs)}ms`)
  }
}

async function phase3Logins() {
  console.log('\nPhase 3 — Demo account login')

  for (const account of DEMO_ACCOUNTS) {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: account.email, password: account.password },
      label: `login ${account.role}`,
    })
    if (res.status !== 200) {
      fail(`login ${account.role}`, `HTTP ${res.status}`)
      continue
    }
    if (res.json?.email === account.email && res.json?.role === account.role) {
      pass(`login ${account.role} → ${res.json.name}`)
    } else {
      fail(`login ${account.role}`, `unexpected body: ${JSON.stringify(res.json)}`)
    }
  }
}

async function phase4Features() {
  console.log('\nPhase 4 — Tournaments & reviews')

  const tournaments = await request('/api/tournaments', { label: 'GET /api/tournaments' })
  if (tournaments.status !== 200 || !Array.isArray(tournaments.json) || !tournaments.json.length) {
    fail('tournaments list', 'empty or failed')
    return
  }

  const firstId = tournaments.json[0].id
  const detail = await request(`/api/tournaments/${firstId}`, { label: 'GET /api/tournaments/:id' })
  if (detail.status === 200 && detail.json?.id === firstId) {
    pass(`GET /api/tournaments/${firstId} → 200`)
  } else {
    fail('tournament detail', `HTTP ${detail.status}`)
  }

  const club = await request('/api/clubs/azadi-tennis', { label: 'club for reviews' })
  const clubId = club.json?.id
  if (!clubId) {
    fail('club reviews', 'no azadi-tennis club id')
    return
  }

  const reviews = await request(`/api/reviews?clubId=${clubId}`, { label: 'GET /api/reviews' })
  if (reviews.status === 200 && Array.isArray(reviews.json) && reviews.json.length > 0) {
    pass(`GET /api/reviews?clubId=… → 200 (${reviews.json.length} items)`)
  } else {
    fail('club reviews', `HTTP ${reviews.status}, count=${Array.isArray(reviews.json) ? reviews.json.length : 'n/a'}`)
  }
}

async function main() {
  console.log(`Shushzerv smoke → ${BASE_URL}`)

  const health = await request('/', { label: 'server health' })
  if (health.status === 0) {
    console.error('\nServer not reachable. Start with: npm run dev  OR  npm run build && PORT=3000 npm run start')
    process.exit(1)
  }
  if (health.status >= 500) {
    fail('server health', `HTTP ${health.status}`)
  } else {
    pass(`server reachable (HTTP ${health.status})`)
  }

  await phase1Api()
  console.log('\n→ Run: npm run build')
  await phase2Schedule()
  console.log('\n→ Run: npm run build')
  await phase3Logins()
  console.log('\n→ Run: npm run build')
  await phase4Features()
  console.log('\n→ Run: npm run build')

  console.log(failed ? `\n${failed} check(s) failed.` : '\nAll smoke checks passed.')
  process.exit(failed ? 1 : 0)
}

main()
