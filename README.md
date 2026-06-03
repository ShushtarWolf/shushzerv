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

If `npm run dev` hits vite-node `EINVAL` socket errors on macOS, use the production build:

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

Bookings confirm without online payment (**pay at club**).

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
| Dashboards | `/dashboard`, `/dashboard/coach`, `/dashboard/club` | prefixed with `/en` |

## Database

- SQLite file: `prisma/dev.db` (gitignored)
- **Seed script** is the source of truth: `npm run db:reset` to recreate
- Studio: `npm run db:studio`

## v1 scope

Included: public browse, booking with persistence, 3 roles + dashboards, PWA shell, bilingual UI.

Not included: real payments, SMS/OTP, production deploy, AloBot assistant.

## Stack

- Nuxt 4 + Vue 3 + TypeScript
- Tailwind CSS (iOS / glass design)
- `@nuxtjs/i18n`, `nuxt-auth-utils`, `@vite-pwa/nuxt`
- Prisma + SQLite
- Nuxt server API (`server/api/**`)
