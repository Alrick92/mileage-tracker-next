#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "[entrypoint] Applying database migrations..."
  npx prisma migrate deploy
fi

if [ "${SEED_ADMIN:-1}" = "1" ] && [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  echo "[entrypoint] Seeding/refreshing admin account: ${ADMIN_EMAIL}"
  npx tsx scripts/seed-admin.ts || echo "[entrypoint] WARN: admin seed failed (continuing)"
fi

echo "[entrypoint] Starting application: $*"
exec "$@"
