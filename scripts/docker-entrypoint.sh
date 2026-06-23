#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:/data/dev.db}"

mkdir -p /data

need_seed=0
if [ ! -f /data/dev.db ]; then
  need_seed=1
fi

echo "Applying database schema..."
npx prisma db push --skip-generate

if [ "$need_seed" = "1" ]; then
  echo "Seeding demo database..."
  npx prisma db seed
fi

echo "Starting Shushzerv..."
exec node .output/server/index.mjs
