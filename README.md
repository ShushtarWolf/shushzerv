# IN BOX S

Bilingual (FA default RTL / EN at `/en`) sports court and class booking demo — Nuxt 4, Prisma, SQLite, local auth, PWA.

Inspired by [alotennis.ir](https://alotennis.ir/) (Alo Play). **Not** a copy: own IN BOX S branding and improved iOS-style UI.

## Requirements

- **Node 22 LTS** (`nvm use` — see `.nvmrc`)
- npm

## Setup

```bash
cd ~/Projects/in-box-s
nvm use
npm install
npm run db:push
npm run db:seed
```

## Run locally

```bash
npm run dev
```

Open http://localhost:3000 (Farsi) and http://localhost:3000/en (English).

The `dev` script sets `TMPDIR=/tmp` to avoid a Nuxt 4.4.7 macOS vite-node socket bug (long paths → 500s / ~20s timeouts). If dev still fails, use the production build:

```bash
npm run build
PORT=3000 npm run start   # loads .env (DATABASE_URL, session secret)
```

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Athlete | `athlete@inboxs.local` | `demo1234` |
| Coach | `coach@inboxs.local` | `demo1234` |
| Club admin | `club@inboxs.local` | `demo1234` |
| Platform admin | `admin@inboxs.local` | `demo1234` |

Book with **wallet (کیف پول)** or pay at the club. Demo wallets are pre-loaded after seed.

## Smoke checklist

Quick regression pass before sharing a demo or merging dashboard work.

### Prerequisites

```bash
npm run db:seed          # tournaments + slots must exist
npm run dev              # or: npm run build && PORT=3000 npm run start
```

Set `NUXT_SESSION_PASSWORD` in `.env` when using the production server (`npm run start`).

### Automated (3 phases)

```bash
npm run smoke
# BASE_URL=http://127.0.0.1:3000 npm run smoke
```

| Phase | Checks |
|-------|--------|
| **1 — API** | `GET /api/tournaments` non-empty · `GET /api/dashboard/charts` → 200 + role-specific fields for athlete, coach, club admin, platform admin |
| **2 — Schedule** | `GET /api/clubs/azadi-tennis` + week schedule → events within 2s (proxy for first-paint calendar) |
| **3 — Auth** | `POST /api/auth/login` succeeds for all four demo accounts |

Run **`npm run build`** after each phase (script prints reminders). Fix failures before continuing.

### Manual (browser, ~2 min)

1. Open `/clubs/azadi-tennis` — schedule grid shows slot/class chips within ~2s (no perpetual spinner).
2. Sign in as each demo role — dashboard loads without 401/403 in the network tab.
3. Visit `/tournaments` — at least two open tournaments listed.

## Demo happy path (per role)

One-page walkthrough for showing the app to someone new. All passwords: `demo1234`.

### Athlete — `athlete@inboxs.local`

1. **Home** → search or tap **Explore** → pick a sport.
2. **Clubs** → open **Azadi Tennis** → select a green slot on the calendar → **Confirm booking** (wallet checkbox if balance allows).
3. **Dashboard** (`/dashboard`) → **Overview** charts load · **Bookings** tab shows the new reservation · **Matches** / **Classes** if enrolled.
4. Optional: **Tournaments** → register for Weekend Tennis Tournament.

### Coach — `coach@inboxs.local`

1. **Dashboard** (`/dashboard/coach`) → overview stats and earnings chart.
2. **Students** tab → see assigned athlete on the 4-week tennis plan.
3. **Plans** tab → view/edit training plan content.
4. **Schedule** tab → upcoming sessions for the week.

### Club admin — `club@inboxs.local`

1. **Dashboard** (`/dashboard/club`) → revenue chart for **Azadi Tennis Complex**.
2. **Schedule** → add or review slots · confirm booked vs available courts.
3. **Bookings** → platform + pay-at-club entries (including guest booking from seed).
4. **Classes** / **Activities** → manage group sessions and club events.

### Platform admin — `admin@inboxs.local`

1. **Dashboard** (`/dashboard/admin`) → platform growth charts (users, clubs, fees).
2. **Users** → search/suspend demo accounts.
3. **Clubs** → feature or inspect **Azadi Tennis**.
4. **News** → create or edit a bilingual article.

## Sharing with friends

- **Code:** push to GitHub; friends clone and run setup above.
- **Live demo:** they need your machine reachable — same Wi‑Fi (`nuxt dev --host`) or a tunnel (ngrok, Cloudflare Tunnel). GitHub alone does not host the running app.

## Routes (FA / EN)

| Page | FA | EN |
|------|----|----|
| Home | `/` | `/en` |
| Explore | `/explore` | `/en/explore` |
| Clubs | `/clubs` | `/en/clubs` |
| Club + booking | `/clubs/:slug` | `/en/clubs/:slug` |
| Sport | `/sports/:slug` | `/en/sports/:slug` |
| Coaches | `/coaches` | `/en/coaches` |
| News | `/news` | `/en/news` |
| Login / Register | `/login`, `/register` | `/en/login`, … |
| Dashboards | `/dashboard`, `/dashboard/coach`, `/dashboard/club`, `/dashboard/admin` | prefixed with `/en` |

## Database

- SQLite file: `prisma/dev.db` (gitignored)
- **Seed script** is the source of truth: `npm run db:reset` to recreate
- Studio: `npm run db:studio`

## v1 scope

Included: public browse, court booking, group classes, open matches (player matching), training plans, skill levels, club events, IN BOX Assistant assistant, 4 roles + full dashboards (wallet/کیف پول, finance stats), PWA shell, bilingual UI.

Not included: real payment gateway, SMS/OTP, production deploy, global/multi-country network.

### Demo-only API behavior

- **`GET /api/coach/sessions?coachId=…`** is intentionally public (no auth) so coach profile pages can list bookable sessions in the demo. **`POST /api/coach/sessions`** still requires a logged-in athlete.

## Stack

- Nuxt 4 + Vue 3 + TypeScript
- Tailwind CSS (iOS / glass design)
- `@nuxtjs/i18n`, `nuxt-auth-utils`, `@vite-pwa/nuxt`
- Prisma + SQLite
- Nuxt server API (`server/api/**`)
