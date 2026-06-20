#!/usr/bin/env bash
set -e

# Run from repository root: ./backend/scripts/migrate.sh
cd "$(dirname "$0")/.."

echo "Generating Prisma client..."
npx prisma generate

# Try deploy (for CI) then fallback to dev (local)
if npx prisma migrate deploy 2>/dev/null; then
  echo "Migrations applied (deploy)."
else
  echo "Running prisma migrate dev (local)..."
  npx prisma migrate dev --name init --skip-seed
fi

# Seed (optional) -- requires ts-node or node-built seed.js
if [ -f prisma/seed.ts ]; then
  echo "Seeding database (prisma/seed.ts)..."
  npx ts-node prisma/seed.ts || echo "ts-node not available; skip seed."
fi

echo "Done."
