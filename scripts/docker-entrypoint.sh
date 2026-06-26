#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:///data/dev.db}"

mkdir -p /data

restore_demo_db() {
  echo "Restoring demo database..."
  cp /app/prisma/demo.db /data/dev.db
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
  if [ "$club_count" = "0" ]; then
    restore_demo_db
  fi
fi

echo "Applying database schema..."
npx prisma db push --skip-generate

echo "Starting IN BOX S..."
exec node .output/server/index.mjs
