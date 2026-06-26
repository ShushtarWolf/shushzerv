#!/usr/bin/env bash
# Deploy IN BOX S demo to Fly.io (run from repo root after `fly auth login` + billing set up).
set -euo pipefail

APP=in-box-s-demo
REGION=fra
export PATH="${FLYCTL_INSTALL:-$HOME/.fly}/bin:$PATH"

if ! flyctl auth whoami &>/dev/null; then
  echo "Run: flyctl auth login"
  exit 1
fi

if ! flyctl apps list 2>/dev/null | grep -q "$APP"; then
  echo "Creating app $APP..."
  flyctl apps create "$APP" --org personal
fi

if ! flyctl volumes list -a "$APP" 2>/dev/null | grep -q "data"; then
  echo "Creating 1GB volume in $REGION..."
  flyctl volumes create data --region "$REGION" --size 1 -a "$APP" --yes
fi

if [ -z "${NUXT_SESSION_PASSWORD:-}" ]; then
  NUXT_SESSION_PASSWORD="$(openssl rand -hex 32)"
  echo "Generated NUXT_SESSION_PASSWORD (stored as Fly secret)."
fi

flyctl secrets set "NUXT_SESSION_PASSWORD=$NUXT_SESSION_PASSWORD" -a "$APP"

echo "Deploying..."
flyctl deploy -a "$APP"

echo ""
echo "Demo URL: https://${APP}.fly.dev"
echo "Demo login: athlete@inboxs.local / demo1234"
