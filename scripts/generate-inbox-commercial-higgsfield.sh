#!/usr/bin/env bash
# Generate INBOX commercial via Higgsfield (free plan — Wan 2.7).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYFRAME="${ROOT}/public/videos/inbox-commercial-keyframe.png"
OUT_DIR="${ROOT}/public/videos"
PROMPT_FILE="${ROOT}/public/videos/inbox-commercial-prompt.txt"
DURATION="${HIGGSFIELD_DURATION:-5}"

if ! command -v higgsfield >/dev/null 2>&1; then
  echo "Install: npm install -g @higgsfield/cli && higgsfield auth login"
  exit 1
fi

if ! higgsfield auth token >/dev/null 2>&1; then
  echo "Not logged in. Run: higgsfield auth login"
  exit 1
fi

if [[ ! -f "$KEYFRAME" ]]; then
  echo "Missing keyframe: $KEYFRAME"
  exit 1
fi

PROMPT="$(cat "$PROMPT_FILE")"

echo "=== Upload keyframe ==="
UPLOAD_JSON=$(higgsfield upload create "$KEYFRAME" --json)
IMAGE_ID=$(echo "$UPLOAD_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Uploaded: $IMAGE_ID"

echo ""
echo "=== Generating (${DURATION}s, Wan 2.7 — free plan) ==="
JOB_ID=$(higgsfield generate create wan2_7 \
  --prompt "$PROMPT" \
  --start-image "$IMAGE_ID" \
  --duration "$DURATION" \
  --aspect_ratio 16:9 \
  --resolution 720p \
  --json | python3 -c "import sys,json; print(json.load(sys.stdin)[0])")

echo "Job: $JOB_ID"
JOB_JSON=$(higgsfield generate wait "$JOB_ID" --timeout 25m --interval 10s --json)
echo "$JOB_JSON"

URL=$(echo "$JOB_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('url') or d.get('result_url') or d.get('output_url') or '')" 2>/dev/null || true)

if [[ -n "$URL" ]]; then
  OUT="${OUT_DIR}/inbox-commercial-10s.mp4"
  echo "Downloading → $OUT"
  curl -fsSL "$URL" -o "$OUT"
  echo "Done: $OUT"
else
  echo "Job finished. Check: higgsfield generate list"
fi
