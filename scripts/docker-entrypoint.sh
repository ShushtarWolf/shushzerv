#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:///data/dev.db}"

mkdir -p /data

need_seed=0
if [ ! -f /data/dev.db ]; then
  need_seed=1
fi

echo "Applying database schema..."
npx prisma db push --skip-generate

if [ "$need_seed" = "0" ]; then
  club_count="$(node -e "
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })
prisma.club.count()
  .then((count) => process.stdout.write(String(count)))
  .catch(() => process.stdout.write('0'))
  .finally(() => prisma.\$disconnect())
")"
  if [ "$club_count" = "0" ]; then
    echo "Database is empty — seeding demo data..."
    need_seed=1
  fi
fi

if [ "$need_seed" = "1" ]; then
  echo "Seeding demo database..."
  npx prisma db seed
fi

echo "Starting Shushzerv..."
exec node .output/server/index.mjs
