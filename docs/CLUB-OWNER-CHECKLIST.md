# Club owner completeness checklist

Prioritized backlog for making `/dashboard/club` a full product for real club operators.

**Legend:** ✅ Done · 🟡 Partial · ⬜ Not started

---

## P0 — Must-have for self-service (operations + public presence)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **Club profile editor** (name, address, city, pricing, cover, map coords) | ✅ | Manage tab → `PATCH /api/club/profile` |
| 2 | **Add-ons / extras** (rental gear, services) | ✅ | Manage tab → `GET/POST /api/club/addons`, `DELETE …/addons/:id` |
| 3 | **Courts** — add, edit & delete | ✅ | Inline edit in Manage tab |
| 4 | **Slot schedule** — hours, duration, generate, block | ✅ | Existing |
| 5 | **Incoming bookings** — confirm pay-at-club, cancel | ✅ | Existing |
| 6 | **Manual walk-in booking** from schedule | ✅ | Existing |
| 7 | **Wallet & payout** | ✅ | Existing `WalletPanel` |
| 8 | **Finance export** (CSV) | ✅ | Existing |

---

## P1 — High impact, still missing or thin

| # | Item | Status | Notes |
|---|------|--------|-------|
| 9 | **Edit courts** (rename, sport, indoor, gender policy) | ✅ | Inline edit in Manage tab |
| 10 | **Custom slot price** on generate | ✅ | Price field added to slot generator |
| 11 | **Edit activities** | ✅ | Edit modal in Manage tab |
| 12 | **Edit classes** (time, seats, coach, price) | ✅ | Edit modal + max seats on create |
| 13 | **Tournament lifecycle** — edit, cancel, view registrations | ✅ | Tournaments tab |
| 14 | **Reviews inbox** — see athlete reviews, reply | ✅ | Reviews tab + public club page |
| 15 | **Club onboarding wizard** | ✅ | `/club-onboarding` — 4-step setup |

---

## P2 — Scale & polish

| # | Item | Status | Notes |
|---|------|--------|-------|
| 16 | **Bulk slot generation** (week range / recurring template) | ✅ | Manage → bulk generate (max 31 days) |
| 17 | **Coach sessions at club** | ⬜ | Schema supports `CoachSession` — no club UI |
| 18 | **Open matches at venue** | ⬜ | `OpenMatch` linked to club — no club UI |
| 19 | **Profile tab** (owner account, locale, notifications) | ⬜ | Coach/athlete have profile; club admin doesn't |
| 20 | **Image upload** (not URL-only) | ⬜ | Cover is URL field; needs storage pipeline |
| 21 | **Multi-club ownership UX** | 🟡 | Selector works; no cross-club summary |
| 22 | **Featured / platform badges** | ⬜ | Platform admin only |

---

## P3 — Nice to have

| # | Item | Status |
|---|------|--------|
| 23 | Add-on edit (not just delete) | ⬜ |
| 24 | Slug change with redirect | ⬜ |
| 25 | Amenities / tags on public page | ⬜ |
| 26 | Staff sub-accounts (receptionist role) | ⬜ |
| 27 | SMS / email to booked athletes | ⬜ |

---

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Club admin | `club@shushzerv.local` | `demo1234` |

Dashboard: `/dashboard/club` — **Manage** (profile, courts, add-ons), **Reviews**, **Tournaments**.

---

## Suggested next implementation batch

1. Add-on edit UI (P3 #23)  
2. Club owner profile tab (P2 #19)  
3. Coach sessions at club (P2 #17)  
4. Image upload for cover (P2 #20)
