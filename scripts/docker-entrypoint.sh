#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:///data/dev.db}"

mkdir -p /data

restore_demo_db() {
  echo "Restoring demo database..."
  cp /app/prisma/demo.db /data/dev.db
}

demo_login_ok() {
  node -e "
const { PrismaClient } = require('@prisma/client')
const { scryptSync, timingSafeEqual } = require('node:crypto')
function verifySecret(password, stored) {
  const parts = stored.split(':')
  if (parts.length !== 3) return false
  const [, salt, key] = parts
  const derived = scryptSync(password, salt, 64)
  const keyBuf = Buffer.from(key, 'hex')
  if (keyBuf.length !== derived.length) return false
  return timingSafeEqual(keyBuf, derived)
}
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })
prisma.user.findUnique({ where: { email: 'club@inboxs.local' } })
  .then((u) => process.stdout.write(u && verifySecret('demo1234', u.passwordHash) ? '1' : '0'))
  .catch(() => process.stdout.write('0'))
  .finally(() => prisma.\$disconnect())
"
}

if [ ! -f /data/dev.db ]; then
  restore_demo_db
else
  club_count="$(node -e "
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })
prisma.club.count()
  .then((count) => process.stdout.write(String(count)))
  .catch(() => process.stdout.write('0'))
  .finally(() => prisma.\$disconnect())
")"
  demo_ok="$(demo_login_ok)"
  if [ "$club_count" = "0" ] || [ "$demo_ok" != "1" ]; then
    echo "Demo data missing or demo login invalid (clubs=$club_count demo_ok=$demo_ok); restoring seed..."
    restore_demo_db
  fi
fi

echo "Applying database schema..."
npx prisma db push --skip-generate

echo "Starting IN BOX S..."
exec node .output/server/index.mjs
