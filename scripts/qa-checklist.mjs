#!/usr/bin/env node
/**
 * Lightweight QA checklist runner — one HTTP step at a time, no browser.
 *
 * Covers API + page reachability from docs/QA-CHECKLIST.md.
 * Visual / RTL / mobile checks remain manual.
 *
 * Usage:
 *   npm run dev          # terminal 1
 *   npm run qa           # terminal 2
 *
 * Env:
 *   BASE_URL=http://127.0.0.1:3000
 *   QA_STEP_MS=150       delay between steps (default 150, use 0 for fast)
 *   QA_PHASE=all         all | public | auth | athlete | coach | club | admin
 *   QA_REPORT=docs/qa-report.json
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const STEP_MS = Number(process.env.QA_STEP_MS ?? 150)
const PHASE_FILTER = process.env.QA_PHASE ?? 'all'
const REPORT_PATH = resolve(process.env.QA_REPORT ?? 'docs/qa-report.json')
const CLUB_SLUG = process.env.SMOKE_CLUB_SLUG ?? 'azadi-tennis'
const MATCH_TOKEN = process.env.QA_MATCH_TOKEN ?? 'demo1match'

const DEMO = {
  ATHLETE: { email: 'athlete@shushzerv.local', password: 'demo1234' },
  COACH: { email: 'coach@shushzerv.local', password: 'demo1234' },
  CLUB_ADMIN: { email: 'club@shushzerv.local', password: 'demo1234' },
  PLATFORM_ADMIN: { email: 'admin@shushzerv.local', password: 'demo1234' },
}

const CHART_FIELDS = {
  ATHLETE: ['labels', 'spending', 'bookingTrend', 'classTrend', 'matchTrend', 'breakdown'],
  COACH: ['labels', 'earnings', 'sessionTrend', 'breakdown'],
  CLUB_ADMIN: ['labels', 'revenue', 'bookingTrend', 'classTrend', 'dowLabels', 'bookingByDow', 'classByDow', 'breakdown'],
  PLATFORM_ADMIN: ['labels', 'users', 'clubs', 'bookings', 'fees'],
}

const results = []
let passed = 0
let failed = 0
let stepIndex = 0

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
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

async function fetchReq(path, { method = 'GET', body, cookie, accept = 'application/json' } = {}) {
  const headers = { Accept: accept }
  if (body) headers['Content-Type'] = 'application/json'
  if (cookie) headers.Cookie = cookie
  const started = performance.now()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  const ms = Math.round(performance.now() - started)
  const text = await res.text()
  let json = null
  if (accept.includes('json') && text) {
    try { json = JSON.parse(text) } catch { json = null }
  }
  return {
    status: res.status,
    ok: res.ok,
    json,
    text,
    ms,
    location: res.headers.get('location') ?? '',
    cookie: parseCookies(res),
  }
}

async function login(role) {
  const account = DEMO[role]
  const res = await fetchReq('/api/auth/login', {
    method: 'POST',
    body: account,
  })
  if (res.status !== 200 || !res.cookie) {
    throw new Error(`login ${role}: HTTP ${res.status}`)
  }
  return res.cookie
}

async function logout(cookie) {
  await fetchReq('/api/auth/logout', { method: 'POST', cookie })
}

function localDateISO(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

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

function record(phase, label, ok, detail = '', ms = 0) {
  stepIndex += 1
  const entry = { step: stepIndex, phase, label, ok, detail, ms }
  results.push(entry)
  if (ok) {
    passed += 1
    console.log(`  ✓ [${phase}] ${label}${ms ? ` (${ms}ms)` : ''}`)
  } else {
    failed += 1
    console.error(`  ✗ [${phase}] ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

async function step(phase, label, fn) {
  let ok = true
  let detail = ''
  let ms = 0
  try {
    const out = await fn()
    if (out && typeof out === 'object') {
      ok = out.ok !== false
      detail = out.detail ?? ''
      ms = out.ms ?? 0
    }
  } catch (err) {
    ok = false
    detail = err.message
  }
  record(phase, label, ok, detail, ms)
  if (STEP_MS > 0) await sleep(STEP_MS)
}

function shouldRunPhase(phase) {
  if (PHASE_FILTER === 'all') return true
  if (PHASE_FILTER === phase) return true
  if (PHASE_FILTER === 'public') {
    return ['health', 'pages-fa', 'pages-en', 'api-public', 'flows'].includes(phase)
  }
  if (PHASE_FILTER === 'auth') return phase === 'health' || phase === 'auth-guest'
  return false
}

/** --- Phases --- */

async function phaseHealth() {
  console.log('\n▶ health')
  await step('health', 'server reachable', async () => {
    const res = await fetchReq('/', { accept: 'text/html' })
    if (res.status >= 500) return { ok: false, detail: `HTTP ${res.status}`, ms: res.ms }
    return { ok: true, ms: res.ms }
  })
}

async function phasePagesFa(ctx) {
  console.log('\n▶ pages-fa (HTML)')
  const pages = [
    '/',
    '/explore',
    '/clubs',
    '/clubs?book=1',
    `/clubs/${CLUB_SLUG}`,
    '/classes',
    ctx.classPath,
    '/coaches',
    ctx.coachPath,
    '/matches',
    ctx.matchPath,
    `/m/${MATCH_TOKEN}`,
    '/tournaments',
    ctx.tournamentPath,
    '/news',
    '/news/shushzerv-launch',
    '/sports/tennis',
    '/about',
    '/login',
    '/register',
  ].filter(Boolean)

  for (const path of pages) {
    await step('pages-fa', `GET ${path}`, async () => {
      const res = await fetchReq(path, { accept: 'text/html' })
      if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}`, ms: res.ms }
      if (!res.text.includes('__NUXT') && !res.text.toLowerCase().includes('shushzerv')) {
        return { ok: false, detail: 'unexpected HTML body', ms: res.ms }
      }
      return { ok: true, ms: res.ms }
    })
  }
}

async function phasePagesEn(ctx) {
  console.log('\n▶ pages-en (HTML sample)')
  const pages = [
    '/en',
    '/en/explore',
    '/en/clubs',
    `/en/clubs/${CLUB_SLUG}`,
    '/en/login',
    ctx.enClassPath,
  ].filter(Boolean)

  for (const path of pages) {
    await step('pages-en', `GET ${path}`, async () => {
      const res = await fetchReq(path, { accept: 'text/html' })
      if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}`, ms: res.ms }
      return { ok: true, ms: res.ms }
    })
  }
}

async function phaseApiPublic(ctx) {
  console.log('\n▶ api-public')
  const endpoints = [
    '/api/sports',
    '/api/clubs',
    '/api/clubs?featured=true',
    `/api/clubs/${CLUB_SLUG}`,
    '/api/coaches',
    '/api/classes',
    '/api/matches',
    '/api/news',
    '/api/news/shushzerv-launch',
    '/api/tournaments',
    ctx.tournamentApi,
    '/api/reviews?clubId=' + (ctx.clubId ?? ''),
  ].filter((p) => !p.endsWith('='))

  for (const path of endpoints) {
    await step('api-public', `GET ${path}`, async () => {
      const res = await fetchReq(path)
      if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}`, ms: res.ms }
      return { ok: true, ms: res.ms }
    })
  }
}

async function phaseAuthGuest() {
  console.log('\n▶ auth-guest (redirects)')
  const protectedPages = ['/dashboard', '/dashboard/coach', '/dashboard/club', '/dashboard/admin', '/chat', '/onboarding']
  for (const path of protectedPages) {
    await step('auth-guest', `GET ${path} → login`, async () => {
      const res = await fetchReq(path, { accept: 'text/html' })
      const loc = res.location
      if (res.status >= 300 && res.status < 400 && loc.includes('login')) {
        return { ok: true, ms: res.ms }
      }
      if (res.status === 200 && res.text.includes('/login')) {
        return { ok: true, ms: res.ms }
      }
      return { ok: false, detail: `HTTP ${res.status} location=${loc || 'none'}`, ms: res.ms }
    })
  }

  await step('auth-guest', 'GET /api/bookings → 401', async () => {
    const res = await fetchReq('/api/bookings')
    return { ok: res.status === 401, detail: `HTTP ${res.status}`, ms: res.ms }
  })
}

async function phaseAthlete(ctx) {
  console.log('\n▶ athlete')
  let cookie = await login('ATHLETE')
  ctx.cookies = ctx.cookies ?? {}
  ctx.cookies.ATHLETE = cookie

  let dash = await fetchReq('/dashboard', { cookie, accept: 'text/html' })
  if (dash.status >= 300 && dash.status < 400 && dash.location.includes('onboarding')) {
    await fetchReq('/api/profile/onboard', {
      method: 'POST',
      cookie,
      body: { sports: ['tennis'], level: 'INTERMEDIATE' },
    })
    cookie = await login('ATHLETE')
    dash = await fetchReq('/dashboard', { cookie, accept: 'text/html' })
  }

  await step('athlete', 'GET /dashboard → 200', async () => {
    return { ok: dash.status === 200, detail: `HTTP ${dash.status}`, ms: dash.ms }
  })

  const athleteApis = [
    '/api/profile',
    '/api/bookings',
    '/api/profile/enrollments',
    '/api/profile/matches',
    '/api/training-plans',
    '/api/dashboard/stats',
    '/api/dashboard/charts',
    '/api/wallet',
    '/api/notifications',
    '/api/chat',
  ]
  for (const path of athleteApis) {
    await step('athlete', `GET ${path}`, async () => {
      const res = await fetchReq(path, { cookie })
      return { ok: res.status === 200, detail: `HTTP ${res.status}`, ms: res.ms }
    })
  }

  await step('athlete', 'dashboard charts fields', async () => {
    const res = await fetchReq('/api/dashboard/charts', { cookie })
    const missing = CHART_FIELDS.ATHLETE.filter((k) => res.json?.[k] === undefined)
    return {
      ok: res.status === 200 && res.json?.role === 'ATHLETE' && !missing.length,
      detail: missing.length ? `missing ${missing.join(', ')}` : '',
      ms: res.ms,
    }
  })

  await step('athlete', 'GET /dashboard/admin → redirect away', async () => {
    const res = await fetchReq('/dashboard/admin', { cookie, accept: 'text/html' })
    const ok = res.status >= 300 || (res.status === 200 && !res.text.includes('platformAdmin'))
    return { ok, detail: `HTTP ${res.status}`, ms: res.ms }
  })

  await logout(cookie)
}

async function phaseCoach() {
  console.log('\n▶ coach')
  const cookie = await login('COACH')

  await step('coach', 'GET /dashboard/coach → 200', async () => {
    const res = await fetchReq('/dashboard/coach', { cookie, accept: 'text/html' })
    return { ok: res.status === 200, detail: `HTTP ${res.status}`, ms: res.ms }
  })

  for (const path of ['/api/coach/students', '/api/coach/schedule', '/api/dashboard/stats', '/api/dashboard/charts']) {
    await step('coach', `GET ${path}`, async () => {
      const res = await fetchReq(path, { cookie })
      return { ok: res.status === 200, detail: `HTTP ${res.status}`, ms: res.ms }
    })
  }

  await step('coach', 'dashboard charts fields', async () => {
    const res = await fetchReq('/api/dashboard/charts', { cookie })
    const missing = CHART_FIELDS.COACH.filter((k) => res.json?.[k] === undefined)
    return {
      ok: res.status === 200 && res.json?.role === 'COACH' && !missing.length,
      detail: missing.length ? `missing ${missing.join(', ')}` : '',
      ms: res.ms,
    }
  })

  await logout(cookie)
}

async function phaseClub(ctx) {
  console.log('\n▶ club')
  const cookie = await login('CLUB_ADMIN')

  await step('club', 'GET /dashboard/club → 200', async () => {
    const res = await fetchReq('/dashboard/club', { cookie, accept: 'text/html' })
    return { ok: res.status === 200, detail: `HTTP ${res.status}`, ms: res.ms }
  })

  const clubRes = await fetchReq('/api/club', { cookie })
  const clubId = clubRes.json?.[0]?.id
  ctx.clubAdminId = clubId

  const clubApis = [
    '/api/club',
    '/api/club/bookings',
    clubId ? `/api/club/classes?clubId=${clubId}` : null,
    '/api/club/activities',
    '/api/dashboard/stats',
    '/api/dashboard/charts',
  ].filter(Boolean)

  for (const path of clubApis) {
    await step('club', `GET ${path}`, async () => {
      const res = await fetchReq(path, { cookie })
      return { ok: res.status === 200, detail: `HTTP ${res.status}`, ms: res.ms }
    })
  }

  await step('club', 'dashboard charts fields', async () => {
    const res = await fetchReq('/api/dashboard/charts', { cookie })
    const missing = CHART_FIELDS.CLUB_ADMIN.filter((k) => res.json?.[k] === undefined)
    return {
      ok: res.status === 200 && res.json?.role === 'CLUB_ADMIN' && !missing.length,
      detail: missing.length ? `missing ${missing.join(', ')}` : '',
      ms: res.ms,
    }
  })

  await logout(cookie)
}

async function phaseAdmin() {
  console.log('\n▶ admin')
  const cookie = await login('PLATFORM_ADMIN')

  await step('admin', 'GET /dashboard/admin → 200', async () => {
    const res = await fetchReq('/dashboard/admin', { cookie, accept: 'text/html' })
    return { ok: res.status === 200, detail: `HTTP ${res.status}`, ms: res.ms }
  })

  for (const path of ['/api/admin/users', '/api/admin/clubs', '/api/admin/bookings', '/api/admin/matches', '/api/admin/classes', '/api/admin/news', '/api/dashboard/stats', '/api/dashboard/charts']) {
    await step('admin', `GET ${path}`, async () => {
      const res = await fetchReq(path, { cookie })
      return { ok: res.status === 200, detail: `HTTP ${res.status}`, ms: res.ms }
    })
  }

  await step('admin', 'dashboard charts fields', async () => {
    const res = await fetchReq('/api/dashboard/charts', { cookie })
    const missing = CHART_FIELDS.PLATFORM_ADMIN.filter((k) => res.json?.[k] === undefined)
    return {
      ok: res.status === 200 && res.json?.role === 'PLATFORM_ADMIN' && !missing.length,
      detail: missing.length ? `missing ${missing.join(', ')}` : '',
      ms: res.ms,
    }
  })

  await logout(cookie)
}

async function phaseFlows(ctx) {
  console.log('\n▶ flows')
  const { from, to } = weekRange('fa')
  const courtId = ctx.courtId

  if (courtId) {
    await step('flows', `club schedule ${CLUB_SLUG}`, async () => {
      const res = await fetchReq(
        `/api/clubs/${CLUB_SLUG}/schedule?from=${from}&to=${to}&courtId=${courtId}`,
      )
      const count = res.json?.events?.length ?? 0
      return {
        ok: res.status === 200 && count > 0,
        detail: count ? `${count} events` : 'empty schedule',
        ms: res.ms,
      }
    })
  }

  await step('flows', `match by token ${MATCH_TOKEN}`, async () => {
    const res = await fetchReq(`/api/matches/by-token/${MATCH_TOKEN}`)
    return { ok: res.status === 200 && res.json?.shareToken === MATCH_TOKEN, detail: `HTTP ${res.status}`, ms: res.ms }
  })

  await step('flows', `match share page title /m/${MATCH_TOKEN}`, async () => {
    const res = await fetchReq(`/m/${MATCH_TOKEN}`, { accept: 'text/html' })
    const ok = res.status === 200 && !res.text.includes('<title>Shushzerv</title>')
    return { ok, detail: ok ? 'localized title' : 'generic title', ms: res.ms }
  })

  await step('flows', 'demo logins (all roles)', async () => {
    for (const role of Object.keys(DEMO)) {
      const c = await login(role)
      const me = await fetchReq('/api/auth/login', { method: 'POST', body: DEMO[role] })
      if (me.json?.role !== role) return { ok: false, detail: `${role} role mismatch` }
      await logout(c)
    }
    return { ok: true }
  })
}

async function discover(ctx) {
  const club = await fetchReq(`/api/clubs/${CLUB_SLUG}`)
  ctx.clubId = club.json?.id
  ctx.courtId = club.json?.courts?.[0]?.id

  const classes = await fetchReq('/api/classes')
  const classId = classes.json?.[0]?.id
  ctx.classPath = classId ? `/classes/${classId}` : null
  ctx.enClassPath = classId ? `/en/classes/${classId}` : null

  const coaches = await fetchReq('/api/coaches')
  const coachId = coaches.json?.[0]?.id
  ctx.coachPath = coachId ? `/coaches/${coachId}` : null

  const matches = await fetchReq('/api/matches')
  const matchId = matches.json?.[0]?.id
  ctx.matchPath = matchId ? `/matches/${matchId}` : null

  const tournaments = await fetchReq('/api/tournaments')
  const tournamentId = tournaments.json?.[0]?.id
  ctx.tournamentPath = tournamentId ? `/tournaments/${tournamentId}` : null
  ctx.tournamentApi = tournamentId ? `/api/tournaments/${tournamentId}` : null
}

async function main() {
  console.log(`Shushzerv QA checklist → ${BASE_URL}`)
  console.log(`Step delay: ${STEP_MS}ms | Phase filter: ${PHASE_FILTER}`)

  const ctx = {}

  try {
    await discover(ctx)
  } catch (err) {
    console.error(`\nCannot reach server: ${err.message}`)
    console.error('Start with: npm run dev')
    process.exit(1)
  }

  await discover(ctx)

  if (shouldRunPhase('health')) await phaseHealth()
  if (shouldRunPhase('pages-fa')) await phasePagesFa(ctx)
  if (shouldRunPhase('pages-en')) await phasePagesEn(ctx)
  if (shouldRunPhase('api-public')) await phaseApiPublic(ctx)
  if (shouldRunPhase('auth-guest')) await phaseAuthGuest()
  if (shouldRunPhase('athlete')) await phaseAthlete(ctx)
  if (shouldRunPhase('coach')) await phaseCoach()
  if (shouldRunPhase('club')) await phaseClub(ctx)
  if (shouldRunPhase('admin')) await phaseAdmin()
  if (shouldRunPhase('flows')) await phaseFlows(ctx)

  const report = {
    finishedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    stepDelayMs: STEP_MS,
    phaseFilter: PHASE_FILTER,
    passed,
    failed,
    total: passed + failed,
    results,
  }

  try {
    writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)
    console.log(`\nReport written → ${REPORT_PATH}`)
  } catch (err) {
    console.warn(`Could not write report: ${err.message}`)
  }

  console.log(failed ? `\n${failed} check(s) failed, ${passed} passed.` : `\nAll ${passed} checks passed.`)
  console.log('\nManual only: RTL layout, mobile tab bar, maps, charts render, booking UI, a11y.')
  process.exit(failed ? 1 : 0)
}

main()
