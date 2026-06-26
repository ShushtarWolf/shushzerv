#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:///data/dev.db}"

mkdir -p /data

if [ ! -f /data/dev.db ]; then
  echo "Initializing database from demo seed..."
  cp /app/prisma/demo.db /data/dev.db
fi

club_count="$(node -e "
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })
prisma.club.count()
  .then((count) => process.stdout.write(String(count)))
  .catch(() => process.stdout.write('0'))
  .finally(() => prisma.\$disconnect())
")"

if [ "$club_count" = "0" ]; then
  echo "Database empty — restoring demo seed..."
  cp /app/prisma/demo.db /data/dev.db
fi

echo "Applying database schema..."
npx prisma db push --skip-generate

echo "Starting Shushzerv..."
exec node .output/server/index.mjs
