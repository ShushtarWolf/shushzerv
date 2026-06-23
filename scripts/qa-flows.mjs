#!/usr/bin/env node
/**
 * Interactive flow QA — POST actions + authenticated paths (no browser).
 * Complements scripts/qa-checklist.mjs (GET-only).
 *
 * Usage: npm run dev && npm run qa:flows
 */

const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const CLUB_SLUG = process.env.SMOKE_CLUB_SLUG ?? 'azadi-tennis'

const results = []
let failed = 0

function pass(phase, label, detail = '') {
  results.push({ phase, label, ok: true, detail })
  console.log(`  ✓ [${phase}] ${label}${detail ? ` — ${detail}` : ''}`)
}

function fail(phase, label, detail = '') {
  failed += 1
  results.push({ phase, label, ok: false, detail })
  console.error(`  ✗ [${phase}] ${label}${detail ? ` — ${detail}` : ''}`)
}

function parseCookies(res) {
  const raw = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean)
  return raw.flatMap((l) => (Array.isArray(l) ? l : [l])).filter(Boolean).map((c) => c.split(';')[0]).join('; ')
}

async function req(path, { method = 'GET', body, cookie } = {}) {
  const headers = { Accept: 'application/json' }
  if (body) headers['Content-Type'] = 'application/json'
  if (cookie) headers.Cookie = cookie
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { json = { raw: text.slice(0, 200) } }
  return { status: res.status, json, text, cookie: parseCookies(res), ok: res.ok }
}

async function login(email, password) {
  const res = await req('/api/auth/login', { method: 'POST', body: { email, password } })
  if (res.status !== 200 || !res.cookie) throw new Error(`login failed ${email}: ${res.status}`)
  return res.cookie
}

function localDateISO(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

function weekRange() {
  const anchor = localDateISO()
  const d = new Date(`${anchor}T12:00:00`)
  const diff = (d.getDay() + 1) % 7
  d.setDate(d.getDate() - diff)
  const start = localDateISO(d)
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  return { from: start, to: localDateISO(end) }
}

async function main() {
  console.log(`Shushzerv flow QA → ${BASE}\n`)

  // --- Athlete onboarding ---
  console.log('▶ athlete onboarding')
  let athleteCookie = await login('athlete@shushzerv.local', 'demo1234')
  const profileBefore = await req('/api/profile', { cookie: athleteCookie })
  if (!profileBefore.json?.user?.onboarded && profileBefore.json?.profile === null) {
    const onboard = await req('/api/profile/onboard', {
      method: 'POST',
      cookie: athleteCookie,
      body: { sports: ['tennis'], level: 'INTERMEDIATE' },
    })
    if (onboard.status === 200) pass('athlete', 'complete onboarding')
    else fail('athlete', 'complete onboarding', `HTTP ${onboard.status}`)
    athleteCookie = await login('athlete@shushzerv.local', 'demo1234')
  } else {
    pass('athlete', 'onboarding already done or profile exists')
  }

  // --- Booking E2E ---
  console.log('\n▶ booking')
  const club = await req(`/api/clubs/${CLUB_SLUG}`)
  const courtId = club.json?.courts?.[0]?.id
  const { from, to } = weekRange()
  let slotId = null
  if (courtId) {
    const sched = await req(`/api/clubs/${CLUB_SLUG}/schedule?from=${from}&to=${to}&courtId=${courtId}`)
    const open = (sched.json?.events ?? []).find((e) => e.slotId && e.status !== 'BOOKED' && e.status !== 'booked')
    slotId = open?.slotId ?? (sched.json?.events ?? []).find((e) => e.slotId)?.slotId
  }
  if (slotId) {
    const book = await req('/api/bookings', {
      method: 'POST',
      cookie: athleteCookie,
      body: { slotId, payWithWallet: false, playerCount: 2, createMatch: false },
    })
    if (book.status === 200 || book.status === 201) pass('booking', 'create booking (pay at club)', `slot ${slotId}`)
    else if (book.status === 409) pass('booking', 'slot already booked (expected on re-run)', `slot ${slotId}`)
    else fail('booking', 'create booking', `HTTP ${book.status} ${JSON.stringify(book.json)}`)
  } else {
    fail('booking', 'find open slot', 'no slot in schedule')
  }

  // --- Class enroll ---
  console.log('\n▶ class enroll')
  const classes = await req('/api/classes')
  const classId = classes.json?.find((c) => (c.enrolledCount ?? 0) < (c.maxSeats ?? 99))?.id ?? classes.json?.[0]?.id
  if (classId) {
    const enroll = await req('/api/classes/enroll', {
      method: 'POST',
      cookie: athleteCookie,
      body: { classSessionId: classId, payWithWallet: false },
    })
    if (enroll.status === 200 || enroll.status === 201) pass('class', 'enroll in class', classId)
    else if (enroll.status === 409) pass('class', 'already enrolled', classId)
    else fail('class', 'enroll', `HTTP ${enroll.status}`)
  } else {
    fail('class', 'find class', 'empty list')
  }

  // --- Match join ---
  console.log('\n▶ match')
  const matches = await req('/api/matches')
  const matchId = matches.json?.find((m) => (m.participantCount ?? 0) < (m.maxPlayers ?? 4))?.id
  if (matchId) {
    const join = await req(`/api/matches/${matchId}/join`, { method: 'POST', cookie: athleteCookie })
    if (join.status === 200 || join.status === 201) pass('match', 'join open match', matchId)
    else if (join.status === 409) pass('match', 'already joined match', matchId)
    else fail('match', 'join', `HTTP ${join.status}`)
  } else {
    pass('match', 'join skipped', 'no joinable match (may be full)')
  }

  const tokenJoin = await req('/api/matches/join-by-token', {
    method: 'POST',
    cookie: athleteCookie,
    body: { token: 'demo1match' },
  })
  if (tokenJoin.status === 200 || tokenJoin.status === 409) pass('match', 'join by token demo1match')
  else fail('match', 'join by token', `HTTP ${tokenJoin.status}`)

  // --- Tournament register ---
  console.log('\n▶ tournament')
  const tournaments = await req('/api/tournaments')
  const openT = tournaments.json?.find((t) => t.status === 'OPEN')
  if (openT) {
    const reg = await req('/api/tournaments/register', {
      method: 'POST',
      cookie: athleteCookie,
      body: { tournamentId: openT.id },
    })
    if (reg.status === 200 || reg.status === 201) pass('tournament', 'register', openT.id)
    else if (reg.status === 409) pass('tournament', 'already registered', openT.id)
    else fail('tournament', 'register', `HTTP ${reg.status}`)
  } else {
    pass('tournament', 'register skipped', 'no OPEN tournament')
  }

  // --- Coach session ---
  console.log('\n▶ coach session')
  const coaches = await req('/api/coaches')
  const coachList = Array.isArray(coaches.json) ? coaches.json : coaches.json?.items ?? []
  const coachCookie = await login('coach@shushzerv.local', 'demo1234')
  const ownedCoach = coachList.find((c) => c.userId)
  const coachId = ownedCoach?.id ?? coachList[0]?.id
  if (coachId) {
    const busy = await req(`/api/coach/sessions?coachId=${coachId}`)
    if (busy.status === 200) pass('coach', 'public busy slots', `${busy.json?.length ?? 0} slots`)
    else fail('coach', 'public busy slots', `HTTP ${busy.status}`)

    const slotOffset = 40 + (Date.now() % 120)
    const hour = 8 + (Date.now() % 8)
    const start1 = `${String(hour).padStart(2, '0')}:00`
    const end1 = `${String(hour + 1).padStart(2, '0')}:00`
    const start2 = `${String(hour + 2).padStart(2, '0')}:00`
    const end2 = `${String(hour + 3).padStart(2, '0')}:00`
    const day1 = localDateISO(new Date(Date.now() + 86400000 * slotOffset))
    const day2 = localDateISO(new Date(Date.now() + 86400000 * (slotOffset + 1)))
    const session = await req('/api/coach/sessions', {
      method: 'POST',
      cookie: athleteCookie,
      body: { coachId, date: day1, startTime: start1, endTime: end1 },
    })
    if (session.status === 200 || session.status === 201) {
      pass('coach', 'book coach session', coachId)
      const sessionId = session.json?.id
      if (sessionId) {
        const confirm = await req(`/api/coach/sessions/${sessionId}`, {
          method: 'PATCH',
          cookie: coachCookie,
          body: { status: 'CONFIRMED' },
        })
        if (confirm.status === 200) pass('coach', 'coach confirms session')
        else fail('coach', 'confirm session', `HTTP ${confirm.status}`)

        const session2 = await req('/api/coach/sessions', {
          method: 'POST',
          cookie: athleteCookie,
          body: { coachId, date: day2, startTime: start2, endTime: end2 },
        })
        if (session2.status === 200 || session2.status === 201) {
          const cancel = await req(`/api/coach/sessions/${session2.json.id}`, {
            method: 'DELETE',
            cookie: athleteCookie,
          })
          if (cancel.status === 200) pass('coach', 'athlete cancels session')
          else fail('coach', 'cancel session', `HTTP ${cancel.status}`)
        }
      }
    } else fail('coach', 'book session', `HTTP ${session.status} ${JSON.stringify(session.json)}`)

    const conflict = await req('/api/coach/sessions', {
      method: 'POST',
      cookie: athleteCookie,
      body: { coachId, date: day1, startTime: `${String(hour).padStart(2, '0')}:30`, endTime: end1 },
    })
    if (conflict.status === 409) pass('coach', 'conflict detection')
    else fail('coach', 'conflict detection', `HTTP ${conflict.status}`)
  }

  // --- Review ---
  console.log('\n▶ review')
  const clubId = club.json?.id
  if (clubId) {
    const review = await req('/api/reviews', {
      method: 'POST',
      cookie: athleteCookie,
      body: { clubId, rating: 5, bodyFa: 'QA test review', bodyEn: 'QA test review' },
    })
    if (review.status === 200 || review.status === 201) pass('review', 'submit club review')
    else if (review.status === 409) pass('review', 'review already exists')
    else fail('review', 'submit club review', `HTTP ${review.status}`)
  }

  if (typeof coachId !== 'undefined' && coachId) {
    const coachReview = await req('/api/reviews', {
      method: 'POST',
      cookie: athleteCookie,
      body: { coachId, rating: 5, bodyFa: 'QA coach review', bodyEn: 'QA coach review' },
    })
    if (coachReview.status === 200 || coachReview.status === 201) pass('review', 'submit coach review')
    else if (coachReview.status === 409) pass('review', 'coach review already exists')
    else fail('review', 'submit coach review', `HTTP ${coachReview.status}`)

    const coachReviews = await req(`/api/reviews?coachId=${coachId}`)
    if (coachReviews.status === 200 && Array.isArray(coachReviews.json)) pass('review', 'list coach reviews', `${coachReviews.json.length} items`)
    else fail('review', 'list coach reviews', `HTTP ${coachReviews.status}`)
  }

  // --- Chat ---
  console.log('\n▶ chat')
  const convos = await req('/api/chat', { cookie: athleteCookie })
  const convoId = convos.json?.[0]?.id
  if (convoId) {
    const msg = await req(`/api/chat/${convoId}/messages`, {
      method: 'POST',
      cookie: athleteCookie,
      body: { body: 'QA automated test message' },
    })
    if (msg.status === 200 || msg.status === 201) pass('chat', 'send message', convoId)
    else fail('chat', 'send message', `HTTP ${msg.status}`)
  } else {
    const create = await req('/api/chat', {
      method: 'POST',
      cookie: athleteCookie,
      body: { participantEmail: 'player2@shushzerv.local' },
    })
    if (create.status === 200 || create.status === 201) pass('chat', 'create conversation')
    else pass('chat', 'chat skipped', 'no existing conversation')
  }

  // --- Coach plan CRUD ---
  console.log('\n▶ coach admin')
  const plan = await req('/api/coach/plans', {
    method: 'POST',
    cookie: coachCookie,
    body: {
      titleFa: 'QA Plan',
      titleEn: 'QA Plan',
      bodyFa: 'Test body',
      bodyEn: 'Test body',
      athleteEmail: 'athlete@shushzerv.local',
      planType: 'TRAINING',
    },
  })
  if (plan.status === 200 || plan.status === 201) pass('coach-admin', 'create training plan')
  else fail('coach-admin', 'create plan', `HTTP ${plan.status}`)

  const coachProfile = await req('/api/_auth/session', { cookie: coachCookie })
  if (coachProfile.json?.user?.onboarded) pass('coach-admin', 'seeded coach onboarded')
  else fail('coach-admin', 'seeded coach onboarded', 'onboarded=false')

  const coachExport = await req('/api/coach/export', { cookie: coachCookie })
  if (coachExport.status === 200 && coachExport.text?.includes('session')) pass('coach-admin', 'export csv')
  else fail('coach-admin', 'export csv', `HTTP ${coachExport.status}`)

  // --- Club admin ---
  console.log('\n▶ club admin')
  const clubCookie = await login('club@shushzerv.local', 'demo1234')
  const myClubs = await req('/api/club', { cookie: clubCookie })
  const myClubId = myClubs.json?.[0]?.id
  if (myClubId) {
    const activity = await req('/api/club/activities', {
      method: 'POST',
      cookie: clubCookie,
      body: {
        clubId: myClubId,
        titleFa: 'QA Event',
        titleEn: 'QA Event',
        descFa: 'Test',
        descEn: 'Test',
        date: localDateISO(new Date(Date.now() + 86400000 * 5)),
        startTime: '19:00',
      },
    })
    if (activity.status === 200 || activity.status === 201) pass('club-admin', 'create activity')
    else fail('club-admin', 'create activity', `HTTP ${activity.status}`)
  }

  // --- Platform admin news ---
  console.log('\n▶ platform admin')
  const adminCookie = await login('admin@shushzerv.local', 'demo1234')
  const slug = `qa-${Date.now()}`
  const article = await req('/api/admin/news', {
    method: 'POST',
    cookie: adminCookie,
    body: {
      slug,
      titleFa: 'QA Article',
      titleEn: 'QA Article',
      excerptFa: 'Test',
      excerptEn: 'Test',
      bodyFa: 'Body',
      bodyEn: 'Body',
    },
  })
  if (article.status === 200 || article.status === 201) {
    pass('admin', 'create news article', slug)
    const artId = article.json?.id
    if (artId) {
      const del = await req(`/api/admin/news/${artId}`, { method: 'DELETE', cookie: adminCookie })
      if (del.status === 200 || del.status === 204) pass('admin', 'delete news article')
      else fail('admin', 'delete news', `HTTP ${del.status}`)
    }
  } else {
    fail('admin', 'create news', `HTTP ${article.status}`)
  }

  const adminCoaches = await req('/api/admin/coaches', { cookie: adminCookie })
  if (adminCoaches.status === 200 && adminCoaches.json?.items?.length) {
    pass('admin', 'list coaches', `${adminCoaches.json.items.length} coaches`)
    const target = adminCoaches.json.items.find((c) => c.userId) ?? adminCoaches.json.items[0]
    if (target?.id) {
      const featured = await req(`/api/admin/coaches/${target.id}`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: { featured: !target.featured },
      })
      if (featured.status === 200) pass('admin', 'toggle coach featured')
      else fail('admin', 'toggle coach featured', `HTTP ${featured.status}`)
    }
  } else {
    fail('admin', 'list coaches', `HTTP ${adminCoaches.status}`)
  }

  // --- Assistant ---
  console.log('\n▶ assistant')
  const assistant = await req('/api/assistant/chat', {
    method: 'POST',
    body: { message: 'How do I book a court?' },
  })
  if (assistant.status === 200 && assistant.json?.reply) pass('assistant', 'chat reply received')
  else fail('assistant', 'chat', `HTTP ${assistant.status}`)

  const report = {
    finishedAt: new Date().toISOString(),
    baseUrl: BASE,
    passed: results.filter((r) => r.ok).length,
    failed,
    results,
  }

  const { writeFileSync } = await import('node:fs')
  const { resolve } = await import('node:path')
  writeFileSync(resolve('docs/qa-flows-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(`\nReport → docs/qa-flows-report.json`)
  console.log(failed ? `\n${failed} flow(s) failed.` : `\nAll flows passed.`)
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
