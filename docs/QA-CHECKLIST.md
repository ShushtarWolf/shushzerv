# IN BOX S — Page-by-Page QA Checklist

Use this checklist for manual reviews before releases. It maps to routes under `app/pages/` and the shared layouts in `app/layouts/`.

## How to run a review

**Test matrix:** every page × **guest / athlete / coach / club admin / platform admin** × `**fa` (RTL) / `en` (LTR)** × **mobile (tab bar) / desktop (header)**.

### Demo accounts

Seeded in `prisma/seed.ts`; also referenced in `scripts/smoke.mjs`.


| Role           | Email                     | Password   |
| -------------- | ------------------------- | ---------- |
| Athlete        | `athlete@inboxs.local` | `demo1234` |
| Coach          | `coach@inboxs.local`   | `demo1234` |
| Club admin     | `club@inboxs.local`    | `demo1234` |
| Platform admin | `admin@inboxs.local`   | `demo1234` |


### Automated baseline (low CPU — no browser)

Runs the checklist **step by step** over HTTP only (one request at a time, ~150ms pause between steps):

```bash
npm run dev          # terminal 1
npm run qa           # terminal 2  (~1–2 min, gentle on CPU)
npm run qa:fast      # no delay between steps
```

What `npm run qa` covers automatically:

- Public pages (fa + en sample) return 200 HTML
- Public APIs return 200 JSON
- Auth-gated pages redirect guests to login; `/api/bookings` → 401
- Per-role dashboard pages + APIs (athlete, coach, club, admin)
- Chart payload fields per role
- Club schedule, match share token, demo logins

Report written to `docs/qa-report.json`. Full combined review: [QA-REVIEW-REPORT.md](./QA-REVIEW-REPORT.md).

Flow tests (POST actions): `npm run qa:flows` → `docs/qa-flows-report.json`.

Still **manual on device**: Leaflet pins at mobile width, ApexCharts paint, push notifications, full keyboard/a11y audit.

Optional env:

| Variable | Default | Purpose |
|----------|---------|---------|
| `BASE_URL` | `http://localhost:3000` | Target server |
| `QA_STEP_MS` | `150` | Delay between steps (set `0` for fast) |
| `QA_PHASE` | `all` | Run one phase: `public`, `auth`, `athlete`, `coach`, `club`, `admin` |
| `SMOKE_CLUB_SLUG` | `azadi-tennis` | Club used in schedule/detail checks |
| `QA_MATCH_TOKEN` | `demo1match` | Shareable match token |

Quick smoke (API-only subset):

```bash
npm run smoke
```

### Sample deep-dive URLs

- Club detail: `/clubs/azadi-tennis`
- Shareable match: `/m/demo1match`
- English prefix: `/en/clubs`, `/en/dashboard`, etc. (`fa` is default at `/`)

### Suggested review order

1. Run smoke script (API health, logins, chart payloads).
2. **Guest critical path:** Home → Explore → Sport → Clubs → Club detail (view only) → News.
3. **Athlete E2E:** Login → Onboarding (new user) → Book court → Enroll class → Create/join match → Share link → Dashboard tabs.
4. **Coach:** Plans, students, schedule, profile.
5. **Club admin:** Schedule/slots, bookings, manage courts/classes, tournament.
6. **Admin:** Users, clubs, news CRUD.
7. **Locale pass:** Repeat steps 2–4 under `/en/...`.
8. **Mobile pass:** Tab bar, sticky booking bar, dashboard drawer.

---

## Global checks (default layout)

Applies to public pages using `app/layouts/default.vue`.

- [ ] Header: Home, Explore, Clubs, Matches; “More” → Classes, Coaches, Tournaments, News, Chat
- [ ] Mobile tab bar: 5 tabs; center “Book” → `/clubs?book=1`; profile → dashboard or login
- [ ] Locale switch: `fa` at `/`; English at `/en/...`; RTL/LTR layout flip
- [ ] Logged-in state: dashboard link, display name, logout
- [ ] Footer links (e.g. About)
- [ ] Assistant widget opens and responds (`/api/assistant/chat`)
- [ ] Toast notifications appear and dismiss (`SzToast`)
- [ ] Page titles set via `useHead`
- [ ] Loading skeletons resolve to content (where applicable)
- [ ] Error page (`app/error.vue`): 404, 403, 500 copy + “Back home” / “Try again”

---

## Public pages

### `/` — Home

File: `app/pages/index.vue`

- [ ] Hero search submits / navigates with filters
- [ ] Clubs map loads pins; popup opens (`ClubsMap`, `ClubMapPopup`)
- [ ] Feature cards render
- [ ] Featured clubs (6), classes (3), coaches (4), news (4) load or show empty state
- [ ] CTA banner, testimonials, trust strip, sport showcase
- [ ] “View all” links go to correct list pages
- [ ] `HomeSectionSkeleton` while pending

### `/explore` — Sport discovery

File: `app/pages/explore.vue`

- [ ] Group tabs: racket, ball, fitness, water, combat
- [ ] Sport cards link to `/sports/[slug]`
- [ ] Sport theme colors on active/hover
- [ ] Empty group handled gracefully

### `/sports/[slug]` — Sport hub

File: `app/pages/sports/[slug].vue`

- [ ] Valid slug (e.g. `tennis`) shows sport name + filtered clubs/coaches
- [ ] Invalid slug → 404
- [ ] Club/coach cards link to detail pages

### `/clubs` — Club listing

File: `app/pages/clubs/index.vue`

- [ ] List vs map toggle
- [ ] Filters: sport, city, date (7 days), search `q`, indoor, gender policy
- [ ] Query params sync to URL (`?sport=&city=&date=&q=`)
- [ ] `?book=1` booking intent (list view default)
- [ ] `?near=1` geolocation + distance sort
- [ ] Sort: default, price, distance
- [ ] Cards link to `/clubs/[slug]`
- [ ] Map view pins + popups
- [ ] Empty results state

### `/clubs/[slug]` — Club detail + booking

File: `app/pages/clubs/[slug].vue`

**Critical path — test end-to-end as athlete.**

- [ ] Cover, name, address, rating, price-from, sport badges
- [ ] Cancellation policy block
- [ ] **Booking flow:** court → week calendar slot → confirm sticky bar
- [ ] Guest booking redirects to login
- [ ] Pay-at-club vs wallet checkbox; insufficient balance (402) message
- [ ] Player count (2/4), “create match after book” option
- [ ] Success modal: view bookings, view/create match, `.ics` download
- [ ] `ClubReviews`: list + submit review (logged in)
- [ ] Club activities section
- [ ] Invalid slug → 404
- [ ] Schedule API (`/api/clubs/{slug}/schedule`) loads within acceptable time

### `/classes` — Class listing

File: `app/pages/classes/index.vue`

- [ ] List loads with sport filter
- [ ] Cards link to `/classes/[id]`
- [ ] Empty / loading states

### `/classes/[id]` — Class detail

File: `app/pages/classes/[id].vue`

- [ ] Sport, club, coach, date/time, seats, price display
- [ ] Enroll (login required); wallet vs pay-at-club
- [ ] Insufficient wallet → toast + error (402)
- [ ] Cancel enrollment
- [ ] Enroll success toast

### `/coaches` — Coach listing

File: `app/pages/coaches/index.vue`

- [ ] Grid loads; cards link to `/coaches/[id]`
- [ ] Loading skeleton

### `/coaches/[id]` — Coach profile

File: `app/pages/coaches/[id].vue`

- [ ] Avatar, rating, sessions, session price, bio
- [ ] Book session form (date, start/end time)
- [ ] Login gate; success/error toast
- [ ] 404 for bad id

### `/matches` — Open matches

File: `app/pages/matches/index.vue`

- [ ] Sport filter refreshes list
- [ ] Match cards link to `/matches/[id]`
- [ ] Create match form (login required): sport, city, date, time, levels, notes
- [ ] Share URL generated after create (`/m/{token}`)

### `/matches/[id]` — Match detail

File: `app/pages/matches/[id].vue`

- [ ] Match info, participants, skill range
- [ ] Join / leave (login required)
- [ ] Copy share link (`/m/{shareToken}`)
- [ ] Leave redirects to `/matches`

### `/m/[token]` — Shareable match link

File: `app/pages/m/[token].vue`

- [ ] Loads via token (seed example: `/m/demo1match`)
- [ ] Guest can view; join requires login
- [ ] Join-by-token success / error messages
- [ ] Works when opened as external full URL

### `/tournaments` — Tournament listing

File: `app/pages/tournaments/index.vue`

- [ ] List loads; cards link to `/tournaments/[id]`
- [ ] Status badges (OPEN, FULL, etc.)

### `/tournaments/[id]` — Tournament detail

File: `app/pages/tournaments/[id].vue`

- [ ] Title, sport, club, date, capacity, price
- [ ] Register (login required); success toast
- [ ] Full/cancelled states handled
- [ ] 404 for missing tournament

### `/news` — News listing

File: `app/pages/news/index.vue`

- [ ] Articles load; cards link to `/news/[slug]`
- [ ] Cover images from `/demo/news/`

### `/news/[slug]` — Article detail

File: `app/pages/news/[slug].vue`

- [ ] Title, excerpt, body, cover, date
- [ ] Locale picks Fa/En fields correctly
- [ ] Invalid slug → 404

### `/about` — About

File: `app/pages/about.vue`

- [ ] Static content renders in both locales
- [ ] Page title

---

## Auth & onboarding

### `/login`

File: `app/pages/login.vue`

- [ ] Valid demo credentials per role
- [ ] Invalid credentials → error toast
- [ ] Athlete not onboarded → `/onboarding`
- [ ] Other roles → role dashboard (`useDashboardPath`)
- [ ] Link to register

### `/register`

File: `app/pages/register.vue`

- [ ] Form validation (name, email, password, sports)
- [ ] Creates athlete account
- [ ] Redirect to onboarding or dashboard
- [ ] Duplicate email error

### `/onboarding`

File: `app/pages/onboarding.vue` — middleware: `auth`

- [ ] Pick 1–4 sports (toggle limit)
- [ ] Skill level selection
- [ ] Submit → `/api/profile/onboard` → dashboard
- [ ] Non-onboarded athlete redirected here from `/dashboard` (`onboarding-gate`)

---

## Authenticated public pages

### `/chat` — Conversations

File: `app/pages/chat/index.vue` — middleware: `auth`

- [ ] Unauthenticated → `/login`
- [ ] Conversation list loads
- [ ] Links to `/chat/[id]`

### `/chat/[id]` — Thread

File: `app/pages/chat/[id].vue` — middleware: `auth`

- [ ] Messages load; send message
- [ ] Invalid conversation id handling
- [ ] Back to list

---

## Dashboards

Layout: `app/layouts/dashboard.vue` via `DashboardShell`.

Test each tab via sidebar and `?tab=` query (see `useDashboardTab`).

### `/dashboard` — Athlete

File: `app/pages/dashboard/index.vue`

Middleware: `auth`, `role-athlete`, `onboarding-gate`


| Tab             | Checks                                                                      |
| --------------- | --------------------------------------------------------------------------- |
| **overview**    | Stats strip, charts (spending, activity, breakdown), quick actions          |
| **schedule**    | `ScheduleCalendar`; week range; events                                      |
| **bookings**    | List; cancel booking                                                        |
| **enrollments** | Class enrollments; cancel                                                   |
| **wallet**      | `WalletPanel`; balance, transactions                                        |
| **plans**       | Assigned training plans                                                     |
| **profile**     | Name, phone, locale, level, sport, favorites, badges, XP; save; push toggle |


Also:

- [ ] Dashboard search (`/api/dashboard/search`)
- [ ] Submit club review from dashboard
- [ ] Sidebar + mobile drawer
- [ ] Logout

### `/dashboard/coach` — Coach

File: `app/pages/dashboard/coach.vue`

Middleware: `auth`, `role-coach`


| Tab          | Checks                                           |
| ------------ | ------------------------------------------------ |
| **overview** | Stats, earnings/session charts, quick actions    |
| **schedule** | Coach schedule calendar                          |
| **students** | Assigned athletes + plans                        |
| **wallet**   | Balance/transactions                             |
| **plans**    | Create/edit/delete plan; assign by athlete email |
| **profile**  | Edit coach profile (bio, city, sport)            |


### `/dashboard/club` — Club admin

File: `app/pages/dashboard/club.vue`

Middleware: `auth`, `role-club`


| Tab             | Checks                                                                       |
| --------------- | ---------------------------------------------------------------------------- |
| **overview**    | Revenue stats, charts, quick actions                                         |
| **schedule**    | Calendar; slot generation; manual club booking                               |
| **wallet**      | Club wallet                                                                  |
| **finance**     | Revenue breakdown / export                                                   |
| **manage**      | Courts CRUD; slot settings; activities; classes; cancellation policy; addons |
| **bookings**    | Incoming bookings; status updates                                            |
| **tournaments** | Create tournament for club                                                   |


Also:

- [ ] Club selector when multiple clubs owned
- [ ] Export (`/api/club/export`)

### `/dashboard/admin` — Platform admin

File: `app/pages/dashboard/admin.vue`

Middleware: `auth`, `role-admin`


| Tab          | Checks                                |
| ------------ | ------------------------------------- |
| **overview** | Platform stats, growth charts         |
| **wallet**   | Platform fees, recent transactions    |
| **users**    | Search, pagination, suspend/unsuspend |
| **clubs**    | Search, pagination, featured toggle   |
| **bookings** | All bookings list                     |
| **matches**  | All matches                           |
| **classes**  | All class sessions                    |
| **news**     | Create, edit, delete articles         |


---

## Dev-only pages

Skip in production QA unless explicitly testing dev tools.


| Route              | File                            | Notes           |
| ------------------ | ------------------------------- | --------------- |
| `/dev/palettes`    | `app/pages/dev/palettes.vue`    | `layout: false` |
| `/dev/sport-icons` | `app/pages/dev/sport-icons.vue` | `layout: false` |


---

## Auth & routing guards


| Scenario                             | Expected                |
| ------------------------------------ | ----------------------- |
| Guest → `/dashboard/`*               | Redirect `/login`       |
| Athlete → `/dashboard/coach`         | Blocked by `role-coach` |
| Coach → `/dashboard/club`            | Blocked by `role-club`  |
| Non-admin → `/dashboard/admin`       | Blocked by `role-admin` |
| Non-onboarded athlete → `/dashboard` | Redirect `/onboarding`  |
| Guest → `/chat/*`                    | Redirect `/login`       |
| Guest book/enroll/join/register      | Redirect `/login`       |


Middleware files: `app/middleware/auth.ts`, `role-*.ts`, `onboarding-gate.ts`.

---

## Cross-cutting checks

Apply while reviewing pages above.


| Area              | What to verify                                                               |
| ----------------- | ---------------------------------------------------------------------------- |
| **i18n**          | No raw translation keys; dates/prices/numbers localized (`useLocaleContent`) |
| **RTL**           | Tab order, icons, calendar week start (FA vs EN)                             |
| **Maps**          | Leaflet loads client-side (`ClubsMap.client.vue`)                            |
| **Charts**        | Apex charts in all 4 dashboard roles; empty/error states                     |
| **Notifications** | Push toggle on athlete profile                                               |
| **Wallet**        | 402 paths: class enroll, club book                                           |
| **Performance**   | Club schedule & home map on throttled network                                |
| **Accessibility** | Focus on modals, form labels, keyboard nav in calendar                       |
| **SEO**           | Per-page titles; news/club detail meta                                       |


---

## Role → dashboard routing

From `app/composables/useDashboardPath.ts`:


| Role             | Dashboard path     |
| ---------------- | ------------------ |
| `ATHLETE`        | `/dashboard`       |
| `COACH`          | `/dashboard/coach` |
| `CLUB_ADMIN`     | `/dashboard/club`  |
| `PLATFORM_ADMIN` | `/dashboard/admin` |


