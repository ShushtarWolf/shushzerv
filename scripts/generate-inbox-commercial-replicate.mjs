#!/usr/bin/env node
/**
 * Generate the INBOX tennis-court commercial via Replicate (Kling v2.6 image-to-video).
 *
 * Usage:
 *   REPLICATE_API_TOKEN=r8_... node scripts/generate-inbox-commercial-replicate.mjs
 *   REPLICATE_API_TOKEN=r8_... node scripts/generate-inbox-commercial-replicate.mjs --keyframe-only
 *
 * Get a token: https://replicate.com/account/api-tokens
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const KEYFRAME = path.join(ROOT, 'public/videos/inbox-commercial-keyframe.png')
const PROMPT_FILE = path.join(ROOT, 'public/videos/inbox-commercial-prompt.txt')
const NEGATIVE_FILE = path.join(ROOT, 'public/videos/inbox-commercial-negative.txt')
const OUT_VIDEO = path.join(ROOT, 'public/videos/inbox-commercial-10s.mp4')

const TOKEN = process.env.REPLICATE_API_TOKEN
const KEYFRAME_ONLY = process.argv.includes('--keyframe-only')
const MODEL = process.env.REPLICATE_MODEL || 'wan-video/wan-2.2-i2v-fast'
const DURATION = Number(process.env.REPLICATE_DURATION || 5)
const ASPECT = process.env.REPLICATE_ASPECT || '16:9'

const KEYFRAME_PROMPT = `Ultra-photorealistic cinematic still frame, professional outdoor red clay tennis court, daytime. Eye-level wide-angle lens, perfectly centered symmetrical composition, locked-off tripod camera.

Soft natural daylight under a slightly cloudy sky: balanced illumination, realistic soft shadows, no harsh sunlight, no blown highlights. Premium, calm, grand atmosphere.

Extremely detailed red clay surface with authentic granular texture, subtle player footprints, faint tennis ball skid marks, crisp white court lines, professional black net with plain white top tape (no logos), surrounding green windbreak fences, lush trees, benches, realistic tennis club environment.

Above the center of the court, hundreds of small realistic yellow-green tennis balls float suspended in midair, precisely arranged to spell the word INBOX in clean capital letters, perfectly aligned and clearly readable from camera.

Style: 8K HDR, high-end cinema camera ARRI look, natural color grading, subtle depth of field, incredible material detail, premium TV commercial quality.`

const DEFAULT_NEGATIVE =
  'cartoon, CGI look, stylized animation, low quality, blurry, overexposed, people, players, logos, watermark, extra text, camera shake, warped geometry, unrealistic lighting, plastic balls, brand marks, text on net'

function die(msg) {
  console.error(`Error: ${msg}`)
  process.exit(1)
}

async function api(pathname, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`https://api.replicate.com/v1${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    die(`${method} ${pathname} → ${res.status}: ${data.detail || data.error || text}`)
  }
  return data
}

function buildModelInput(model, { imageUrl, motionPrompt, negative, duration, aspect }) {
  if (model.includes('wan')) {
    return {
      image: imageUrl,
      prompt: motionPrompt,
      negative_prompt: negative,
      num_frames: Math.min(121, Math.max(49, duration * 16)),
      resolution: '720p',
      frames_per_second: 16,
    }
  }
  return {
    image: imageUrl,
    prompt: motionPrompt,
    negative_prompt: negative,
    duration,
    aspect_ratio: aspect,
    audio: false,
  }
}

async function uploadFile(filePath) {
  const buf = fs.readFileSync(filePath)
  const name = path.basename(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mime =
    ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream'

  const form = new FormData()
  form.append('content', new Blob([buf], { type: mime }), name)
  form.append('filename', name)
  form.append('type', mime)

  console.log(`Uploading keyframe (${(buf.length / 1_048_576).toFixed(2)} MB)…`)
  const res = await fetch('https://api.replicate.com/v1/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  })
  const data = await res.json()
  if (!res.ok) die(`File upload → ${res.status}: ${data.detail || data.error || JSON.stringify(data)}`)
  const url = data.urls?.get
  if (!url) die(`No file URL returned: ${JSON.stringify(data)}`)
  console.log(`Uploaded: ${data.id}`)
  return url
}

async function runModel(model, input) {
  console.log(`\n=== Replicate: ${model} ===`)
  const prediction = await api(`/models/${model}/predictions`, {
    method: 'POST',
    body: { input },
  })

  let result = prediction
  const id = prediction.id
  if (!id) die('No prediction id returned')

  if (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    console.log(`Prediction ${id} — polling…`)
    for (let i = 0; i < 180; i++) {
      await sleep(10_000)
      result = await api(`/predictions/${id}`)
      process.stdout.write(`  status: ${result.status}\r`)
      if (result.status === 'succeeded' || result.status === 'failed' || result.status === 'canceled') break
    }
    console.log('')
  }

  if (result.status === 'failed') {
    die(result.error || 'Prediction failed')
  }
  if (result.status !== 'succeeded') {
    die(`Timed out (last status: ${result.status}). Check https://replicate.com/p/${id}`)
  }
  return result.output
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function downloadUrl(url, dest) {
  console.log(`Downloading → ${dest}`)
  const res = await fetch(url)
  if (!res.ok) die(`Download failed: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  console.log(`Saved ${(buf.length / 1_048_576).toFixed(2)} MB`)
}

async function generateKeyframe() {
  console.log('=== Generating keyframe (Flux 1.1 Pro) ===')
  const output = await runModel('black-forest-labs/flux-1.1-pro', {
    prompt: KEYFRAME_PROMPT,
    aspect_ratio: '16:9',
    output_format: 'png',
    output_quality: 95,
    safety_tolerance: 2,
  })

  const url = Array.isArray(output) ? output[0] : output
  if (!url || typeof url !== 'string') die(`Unexpected keyframe output: ${JSON.stringify(output)}`)
  await downloadUrl(url, KEYFRAME)
}

async function generateVideo() {
  if (!fs.existsSync(KEYFRAME)) die(`Missing keyframe: ${KEYFRAME}`)

  const prompt = fs.readFileSync(PROMPT_FILE, 'utf8').trim()
  const negative = fs.existsSync(NEGATIVE_FILE)
    ? fs.readFileSync(NEGATIVE_FILE, 'utf8').trim()
    : DEFAULT_NEGATIVE

  const motionPrompt = `${prompt}

Camera: completely static locked tripod, zero camera movement throughout.
Motion sequence: tennis balls float gently with subtle micro-drift for ~2 seconds, then simultaneously release and fall under gravity, bouncing on clay with dust puffs, varied bounce heights, balls rolling and settling. Ambient sound: quiet outdoor tennis club atmosphere, soft ball impacts on clay, no music, no voiceover.`

  const imageUrl = await uploadFile(KEYFRAME)
  const input = buildModelInput(MODEL, {
    imageUrl,
    motionPrompt,
    negative,
    duration: DURATION,
    aspect: ASPECT,
  })

  const output = await runModel(MODEL, input)
  const url = Array.isArray(output) ? output[0] : output
  if (!url || typeof url !== 'string') die(`Unexpected video output: ${JSON.stringify(output)}`)
  await downloadUrl(url, OUT_VIDEO)
}

async function main() {
  if (!TOKEN) {
    die(
      'Set REPLICATE_API_TOKEN (https://replicate.com/account/api-tokens)\n' +
        '  export REPLICATE_API_TOKEN=r8_...\n' +
        '  node scripts/generate-inbox-commercial-replicate.mjs',
    )
  }

  if (KEYFRAME_ONLY) {
    await generateKeyframe()
    return
  }

  if (!fs.existsSync(KEYFRAME)) {
    console.log('No keyframe found — generating one first…')
    await generateKeyframe()
  }

  await generateVideo()
  console.log(`\nDone: ${OUT_VIDEO}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
