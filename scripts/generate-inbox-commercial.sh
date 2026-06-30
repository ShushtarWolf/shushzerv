#!/usr/bin/env bash
# Generate the IN BOX S tennis-court commercial via Higgsfield CLI.
# Requires: npm i -g @higgsfield/cli && higgsfield auth login
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYFRAME="${ROOT}/public/videos/inbox-commercial-keyframe.png"
OUT_DIR="${ROOT}/public/videos"
PROMPT_FILE="${ROOT}/public/videos/inbox-commercial-prompt.txt"

if ! command -v higgsfield >/dev/null 2>&1; then
  echo "Install CLI: npm install -g @higgsfield/cli"
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

echo "=== Recommended model: kling_3_0 (image-to-video, physics) ==="
higgsfield model list --video 2>/dev/null | head -30 || true

echo ""
echo "=== Generating 10s commercial (image-to-video) ==="
JOB_JSON=$(higgsfield generate create kling_3_0 \
  --prompt "$PROMPT" \
  --image "$KEYFRAME" \
  --duration 10 \
  --aspect-ratio 16:9 \
  --json \
  --wait \
  --wait-timeout 25m \
  --wait-interval 10s)

echo "$JOB_JSON"

URL=$(echo "$JOB_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('url') or d.get('result_url') or d.get('output_url') or '')" 2>/dev/null || true)

if [[ -n "$URL" ]]; then
  OUT="${OUT_DIR}/inbox-commercial-10s.mp4"
  echo "Downloading → $OUT"
  curl -fsSL "$URL" -o "$OUT"
  echo "Done: $OUT"
else
  echo "Job finished. Check higgsfield generate list for the download URL."
fi
