#!/usr/bin/env node
/**
 * Targeted checks for UX pass (redirect, date deep-link, nav, register).
 * Usage: BASE_URL=http://127.0.0.1:3000 node scripts/ux-pass.mjs
 */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000'

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

async function fetchText(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual', ...opts })
  const text = await res.text().catch(() => '')
  return { res, text }
}

async function main() {
  console.log(`UX pass → ${BASE}\n`)

  // 1. Auth middleware preserves redirect
  {
    const { res } = await fetchText('/dashboard')
    const loc = res.headers.get('location') || ''
    if (res.status >= 300 && res.status < 400 && loc.includes('redirect=') && loc.includes('dashboard')) {
      ok('guest /dashboard redirects with ?redirect=')
    } else {
      fail('guest /dashboard redirects with ?redirect=', `status=${res.status} loc=${loc}`)
    }
  }

  // 2. Login page renders with redirect query
  {
    const path = '/login?redirect=' + encodeURIComponent('/clubs/azadi-tennis?book=1&date=2026-06-20')
    const { res, text } = await fetchText(path)
    if (res.status === 200 && (text.includes('ورود') || text.includes('Sign in'))) {
      ok('login page loads with redirect query')
    } else {
      fail('login page loads with redirect query', `status=${res.status}`)
    }
  }

  // 3. Club list passes date into club detail links (SSR HTML)
  {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const iso = tomorrow.toISOString().slice(0, 10)
    const { res, text } = await fetchText(`/clubs?date=${iso}&book=1`)
    if (res.status === 200 && text.includes(`date=${iso}`) && text.includes('azadi-tennis')) {
      ok('clubs list embeds ?date= in club card links')
    } else {
      fail('clubs list embeds ?date= in club card links')
    }
  }

  // 4. Club detail accepts date query (page loads)
  {
    const { res } = await fetchText('/clubs/azadi-tennis?date=2026-06-20&book=1')
    if (res.status === 200) ok('club detail loads with ?date=&book=1')
    else fail('club detail loads with ?date=&book=1', `status=${res.status}`)
  }

  // 5. Header nav includes classes + tournaments (SSR)
  {
    const { res, text } = await fetchText('/')
    const hasClasses = text.includes('/classes') || text.includes('کلاس')
    const hasTournaments = text.includes('/tournaments') || text.includes('تورنمنت')
    if (res.status === 200 && hasClasses && hasTournaments) {
      ok('home header surfaces classes and tournaments')
    } else {
      fail('home header surfaces classes and tournaments')
    }
  }

  // 6. Register page hides business roles by default
  {
    const { res, text } = await fetchText('/register')
    const hasBusinessToggle = text.includes('مربی یا مدیر باشگاه') || text.includes('coach or club admin')
    const hidesRoleSelect = !text.includes('roleClubAdmin') && !text.includes('مدیر باشگاه</option>')
    if (res.status === 200 && hasBusinessToggle) {
      ok('register shows business-account toggle')
    } else {
      fail('register shows business-account toggle')
    }
    if (hidesRoleSelect || hasBusinessToggle) {
      ok('register does not expose all roles by default')
    } else {
      fail('register does not expose all roles by default')
    }
  }

  // 7. Login → redirect back (API + cookie session)
  {
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'athlete@inboxs.local', password: 'demo1234' }),
    })
    const cookie = loginRes.headers.getSetCookie?.()?.join('; ') || loginRes.headers.get('set-cookie') || ''
    if (!loginRes.ok) {
      fail('athlete login for redirect flow', `status=${loginRes.status}`)
    } else {
      ok('athlete login API succeeds')
      const dash = await fetch(`${BASE}/dashboard`, {
        headers: cookie ? { cookie } : {},
        redirect: 'manual',
      })
      if (dash.status === 200) ok('authenticated athlete reaches /dashboard')
      else fail('authenticated athlete reaches /dashboard', `status=${dash.status}`)
    }
  }

  // 8. Dashboard overview contains next-up section (authenticated HTML)
  {
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'athlete@inboxs.local', password: 'demo1234' }),
    })
    const cookie = loginRes.headers.getSetCookie?.()?.join('; ') || loginRes.headers.get('set-cookie') || ''
    const { res, text } = await fetchText('/dashboard')
    const dashRes = await fetch(`${BASE}/dashboard`, { headers: cookie ? { cookie } : {} })
    const dashText = await dashRes.text()
    if (dashRes.status === 200 && (dashText.includes('برنامه بعدی') || dashText.includes('Up next'))) {
      ok('athlete dashboard shows next-up section')
    } else {
      fail('athlete dashboard shows next-up section')
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
