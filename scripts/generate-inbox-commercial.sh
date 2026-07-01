#!/usr/bin/env bash
# Generate the INBOX tennis-court commercial via Replicate (Kling v2.6).
# Requires: REPLICATE_API_TOKEN — https://replicate.com/account/api-tokens
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "${REPLICATE_API_TOKEN:-}" ]]; then
  echo "Set REPLICATE_API_TOKEN (https://replicate.com/account/api-tokens)"
  echo "  export REPLICATE_API_TOKEN=r8_..."
  exit 1
fi

exec node "${ROOT}/scripts/generate-inbox-commercial-replicate.mjs" "$@"
