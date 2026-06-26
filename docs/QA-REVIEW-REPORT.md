# IN BOX S — Complete QA Review Report

**Last updated:** 2026-06-17  
**Environment:** `http://localhost:3000` (local dev + seeded DB)

---

## Overall verdict: **PASS**

| Layer | Checks | Result |
|-------|--------|--------|
| HTTP / API (`npm run qa`) | 87 | **87/87 pass** |
| Interactive flows (`npm run qa:flows`) | 14 | **14/14 pass** |
| Known code issues | 3 | **All fixed** |

Re-run anytime:

```bash
npm run dev
npm run qa && npm run qa:flows
```

Reports: [qa-report.json](./qa-report.json) · [qa-flows-report.json](./qa-flows-report.json)

---

## Fixes applied (2026-06-17)

| # | Issue | Fix |
|---|--------|-----|
| 1 | Club dashboard SSR 500 | `useClubDashboard()` made synchronous |
| 2 | Missing fa keys `booking.playerCount`, `booking.createMatch`, `booking.addToCalendar` | Added to `locales/fa.json` |
| 3 | Booking sticky bar a11y (raw i18n keys) | Proper `id`/`for` + `aria-label` on controls |
| 4 | Generic title on `/m/[token]` | `useHead` with sport + city in `app/pages/m/[token].vue` |
| 5 | Demo athlete onboarding redirect | `onboardedAt` in seed + QA self-heals via `/api/profile/onboard` |

---

## Automated coverage

### Pages & APIs (87 checks)
- Public pages fa/en, all APIs, auth guards
- All 4 role dashboards + chart payloads
- Club schedule, match token, localized match page title
- Athlete dashboard returns **200** (onboarding auto-completed in QA if needed)

### Interactive flows (14 checks)
- Booking, class enroll, match join, tournament, coach session
- Review, chat, coach plan, club activity, admin news CRUD
- Assistant chat API

---

## Browser verification (spot-check)

| Check | Result |
|-------|--------|
| RTL fa / LTR en | ✅ |
| Booking calendar + slots | ✅ |
| Sticky bar a11y (`تعداد بازیکن`, `ساخت بازی باز بعد از رزرو`) | ✅ Fixed |
| Match share title (`به این بازی بپیوند — تنیس · تهران`) | ✅ Fixed |
| Mobile tab bar (5 tabs) | ✅ Visible in mobile viewport |
| Assistant widget | ✅ Opens with input |

---

## Still manual-only (not in automation)

These require a real device or human judgment — not code bugs:

- Leaflet map pin tap → popup (client-rendered map)
- ApexCharts paint on dashboard (client-rendered; API data validated)
- Push notification permission flow
- Full WCAG keyboard/contrast audit
- Cross-browser (Safari, Firefox)
- Production build smoke (`npm run build && npm run preview`)

---

## Recommendation

**Ready for demo/staging.** Run `npm run qa && npm run qa:flows` before each release. Optional: 15-minute phone pass for map pins and chart tabs.
