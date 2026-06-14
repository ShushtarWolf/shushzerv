# Shushzerv

Bilingual (FA default RTL / EN at `/en`) sports court and class booking demo — Nuxt 4, Prisma, SQLite, local auth, PWA.

Inspired by [alotennis.ir](https://alotennis.ir/) (Alo Play). **Not** a copy: own Shushzerv branding and improved iOS-style UI.

## Requirements

- **Node 22 LTS** (`nvm use` — see `.nvmrc`)
- npm

## Setup

```bash
cd ~/Projects/shushzerv
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
| Athlete | `athlete@shushzerv.local` | `demo1234` |
| Coach | `coach@shushzerv.local` | `demo1234` |
| Club admin | `club@shushzerv.local` | `demo1234` |
| Platform admin | `admin@shushzerv.local` | `demo1234` |

Book with **wallet (کیف پول)** or pay at the club. Demo wallets are pre-loaded after seed.

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

Included: public browse, court booking, group classes, open matches (player matching), training plans, skill levels, club events, ShushBot assistant, 4 roles + full dashboards (wallet/کیف پول, finance stats), PWA shell, bilingual UI.

Not included: real payment gateway, SMS/OTP, production deploy, global/multi-country network.

## Stack

- Nuxt 4 + Vue 3 + TypeScript
- Tailwind CSS (iOS / glass design)
- `@nuxtjs/i18n`, `nuxt-auth-utils`, `@vite-pwa/nuxt`
- Prisma + SQLite
- Nuxt server API (`server/api/**`)
