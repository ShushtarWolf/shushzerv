#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [[ ! -x "$CHROME" ]]; then
  echo "Google Chrome not found at $CHROME" >&2
  exit 1
fi

generate_pdf() {
  local name="$1"
  local html="${2:-$ROOT/${name}.print.html}"
  local pdf="$ROOT/${name}.pdf"
  local public="$ROOT/public/docs/${name}.pdf"

  if [[ ! -f "$html" ]]; then
    echo "Missing $html" >&2
    return 1
  fi

  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-pdf-header-footer \
    --print-to-pdf="$pdf" \
    "file://$html"

  mkdir -p "$(dirname "$public")"
  cp "$pdf" "$public"

  echo "PDF written:"
  echo "  $pdf"
  echo "  $public"
  echo "Download: http://localhost:3000/docs/${name}.pdf"
  echo
}

TARGET="${1:-all}"

case "$TARGET" in
  tutorial) generate_pdf "TUTORIAL-FA" ;;
  shushbot) generate_pdf "SHUSHBOT-FA" ;;
  guide) generate_pdf "USER-GUIDE-FA" ;;
  visual) generate_pdf "USER-GUIDE-VISUAL-FA" "$ROOT/public/docs/USER-GUIDE-VISUAL-FA.html" ;;
  all)
    generate_pdf "TUTORIAL-FA"
    generate_pdf "SHUSHBOT-FA"
    generate_pdf "USER-GUIDE-FA"
    generate_pdf "USER-GUIDE-VISUAL-FA"
    ;;
  *)
    echo "Usage: $0 [tutorial|shushbot|guide|visual|all]" >&2
    exit 1
    ;;
esac
