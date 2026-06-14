# Shushzerv App Phase (PWA-first)

The web redesign is the foundation. The app phase extends the same Nuxt codebase.

## Phase 7A — PWA (current stack)

Already in place via `@vite-pwa/nuxt`:

- Install prompt (`client.installPrompt: true`)
- Standalone display mode
- Orange theme (`#ff5a1f`) + warm background
- Bottom tab bar (mobile)
- Safe-area padding for notched devices

**Next PWA tweaks:**

1. Enable `pwa.devOptions.enabled: true` during development to test install flow
2. Add a 512×512 PNG icon for better store-like install UI
3. Show an in-app “Add to Home Screen” banner after first booking

## Phase 7B — Capacitor wrapper (optional)

Wrap the production Nuxt build for iOS/Android store listing:

```bash
npm run build
npx cap init Shushzerv com.shushzerv.app --web-dir .output/public
npx cap add ios && npx cap add android
```

Native extras to add later:

- Haptic feedback on booking confirm
- Native share sheet for match links (`@capacitor/share`)
- Push notifications for match joins (requires backend)
- Bottom sheets for slot picker (native feel)

## App screens (mirror Anybuddy)

| Screen | Web route today | App priority |
|--------|-----------------|--------------|
| Personalized home | `/` | P0 |
| Map explore | `/clubs` (map default) | P0 |
| Club + slot grid | `/clubs/:slug` | P0 |
| Booking success | modal on club page | P0 |
| Open matches | `/matches` | P1 |
| Match share | `/m/:token` | P1 |
| Chat | `/chat`, `/chat/:id` | P1 |
| Profile + XP | `/dashboard` | P1 |
| Onboarding | `/onboarding` | P2 |

## Gate before native investment

Finish and freeze on web:

- Slot pill UI + sticky CTA
- Sport colors + orange primary
- Chat + match share APIs
- Gamification (XP, badges)
- FA/EN RTL pass on all new components
