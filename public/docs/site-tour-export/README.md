# IN BOX S Site Tour — Export Package

Partner-ready assets to rebuild the click-through demo in any format.

## Contents

| File | Use for |
|------|---------|
| `flow.csv` | Excel, Google Sheets, PowerPoint storyboard |
| `flow.json` | Scripts, video editors, custom players |
| `screenshots/` | All frames used in the tour (PNG, 1280×800) |
| `site-tour.html` | Open in browser — self-playing demo (offline) |

## Flow format

Each row/scene = one button click:

- **frame** — screenshot before click
- **button** — label of what is clicked
- **click_x_pct / click_y_pct** — cursor position (0–100% of image)
- **click_x_px / click_y_px** — same position at 1280×800 reference size
- **result_frame** — screenshot after click (empty = same page, e.g. menu open)
- **duration_ms** — how long to hold after click

## Rebuild in other formats

### PowerPoint / Keynote
1. Import screenshots in step order from `flow.csv`.
2. Add a cursor icon at `click_x_pct` / `click_y_pct` (or use pixel coords).
3. Use slide transitions between `frame` and `result`.

### Video (Premiere, DaVinci, CapCut)
1. Place `screenshots/{frame}.png` on timeline.
2. Animate cursor to pixel coords; hold `duration_ms`.
3. Cut to `screenshots/{result}.png`.

### GIF / Lottie / After Effects
Use `flow.json` — each scene has `click_pct` and `duration_ms`.

### Web embed
Host `site-tour.html` + `screenshots/` folder on any static host.

## Edit the tour

In the main repo, edit `scripts/build-site-tour.mjs` scenes array, then:

```bash
npm run guide:tour
npm run guide:tour:export
```

## Reference

- 39 scenes
- Reference resolution: 1280×800
- Generated: 2026-06-20
