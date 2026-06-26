#!/usr/bin/env node
/**
 * Export site tour as a partner-ready bundle (zip + folder).
 * Includes screenshots, flow data (JSON/CSV), HTML player, README.
 * Run: npm run guide:tour:export
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const FLOW_SRC = path.join(ROOT, 'public/docs/site-tour.flow.json')
const HTML_SRC = path.join(ROOT, 'public/docs/site-tour.html')
const GUIDE_SRC = path.join(ROOT, 'public/docs/guide')
const OUT_DIR = path.join(ROOT, 'public/docs/site-tour-export')
const OUT_ZIP = path.join(ROOT, 'public/docs/site-tour-export.zip')
const REF_W = 1280
const REF_H = 800

if (!existsSync(FLOW_SRC)) {
  console.error('Missing site-tour.flow.json — run: npm run guide:tour')
  process.exit(1)
}

const flow = JSON.parse(readFileSync(FLOW_SRC, 'utf8'))

mkdirSync(path.join(OUT_DIR, 'screenshots'), { recursive: true })

const images = new Set()
for (const s of flow) {
  images.add(s.f)
  if (s.t) images.add(s.t)
}

for (const name of [...images].sort()) {
  const src = path.join(GUIDE_SRC, `${name}.png`)
  const dst = path.join(OUT_DIR, 'screenshots', `${name}.png`)
  if (!existsSync(src)) {
    console.warn('  ⚠ missing', name + '.png')
    continue
  }
  copyFileSync(src, dst)
}

const verbose = flow.map((s, i) => ({
  step: i + 1,
  frame: s.f,
  button: s.l,
  click_pct: { x: s.c[0], y: s.c[1] },
  click_px: { x: Math.round(s.c[0] * REF_W / 100), y: Math.round(s.c[1] * REF_H / 100) },
  result: s.t,
  duration_ms: s.ms,
  screenshot: `screenshots/${s.f}.png`,
  result_screenshot: s.t ? `screenshots/${s.t}.png` : null,
}))

writeFileSync(path.join(OUT_DIR, 'flow.json'), JSON.stringify(verbose, null, 2))

const csvHeader = 'step,frame,button,click_x_pct,click_y_pct,click_x_px,click_y_px,result_frame,duration_ms,screenshot'
const csv = [csvHeader, ...verbose.map((s) => [
  s.step,
  s.frame,
  `"${s.button.replace(/"/g, '""')}"`,
  s.click_pct.x,
  s.click_pct.y,
  s.click_px.x,
  s.click_px.y,
  s.result ?? '',
  s.duration_ms,
  s.screenshot,
].join(','))].join('\n')
writeFileSync(path.join(OUT_DIR, 'flow.csv'), csv, 'utf8')

let html = readFileSync(HTML_SRC, 'utf8')
html = html.replace("const I='guide/'", "const I='screenshots/'")
writeFileSync(path.join(OUT_DIR, 'site-tour.html'), html, 'utf8')

const readme = `# IN BOX S Site Tour — Export Package

Partner-ready assets to rebuild the click-through demo in any format.

## Contents

| File | Use for |
|------|---------|
| \`flow.csv\` | Excel, Google Sheets, PowerPoint storyboard |
| \`flow.json\` | Scripts, video editors, custom players |
| \`screenshots/\` | All frames used in the tour (PNG, 1280×800) |
| \`site-tour.html\` | Open in browser — self-playing demo (offline) |

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
1. Import screenshots in step order from \`flow.csv\`.
2. Add a cursor icon at \`click_x_pct\` / \`click_y_pct\` (or use pixel coords).
3. Use slide transitions between \`frame\` and \`result\`.

### Video (Premiere, DaVinci, CapCut)
1. Place \`screenshots/{frame}.png\` on timeline.
2. Animate cursor to pixel coords; hold \`duration_ms\`.
3. Cut to \`screenshots/{result}.png\`.

### GIF / Lottie / After Effects
Use \`flow.json\` — each scene has \`click_pct\` and \`duration_ms\`.

### Web embed
Host \`site-tour.html\` + \`screenshots/\` folder on any static host.

## Edit the tour

In the main repo, edit \`scripts/build-site-tour.mjs\` scenes array, then:

\`\`\`bash
npm run guide:tour
npm run guide:tour:export
\`\`\`

## Reference

- ${flow.length} scenes
- Reference resolution: ${REF_W}×${REF_H}
- Generated: ${new Date().toISOString().slice(0, 10)}
`
writeFileSync(path.join(OUT_DIR, 'README.md'), readme, 'utf8')

try {
  execSync(`cd "${path.join(ROOT, 'public/docs')}" && zip -rq site-tour-export.zip site-tour-export`, { stdio: 'pipe' })
  console.log('✓', OUT_ZIP)
} catch {
  cpSync(OUT_DIR, path.join(OUT_DIR, '..', 'site-tour-export-copy'), { recursive: true })
  console.log('✓', OUT_DIR, '(zip unavailable — folder ready)')
}

console.log('✓', OUT_DIR)
console.log(`  ${flow.length} scenes, ${images.size} screenshots`)
console.log('  flow.csv, flow.json, site-tour.html, README.md')
