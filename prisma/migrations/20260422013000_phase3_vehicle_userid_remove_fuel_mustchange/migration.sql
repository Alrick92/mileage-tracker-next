-- Phase 3 migration:
--   * Vehicle.userId required (per-user ownership)
--   * Vehicle licensePlate unique scoped to owning user
--   * Trip.fuelLiters removed
--   * Trip → Vehicle FK Cascade -> Restrict (force explicit deletion)
--   * User.mustChangePassword flag for admin-issued resets

ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- 1. Add userId column as nullable so we can backfill existing rows.
ALTER TABLE "Vehicle" ADD COLUMN "userId" TEXT;

-- 2. Backfill from the earliest Trip for each vehicle (that was the original
--    creator for the Phase 1/2 data set).
UPDATE "Vehicle" v
SET "userId" = sub."userId"
FROM (
  SELECT DISTINCT ON (t."vehicleId") t."vehicleId", t."userId"
  FROM "Trip" t
  ORDER BY t."vehicleId", t."createdAt" ASC
) AS sub
WHERE v."id" = sub."vehicleId";

-- 3. Any remaining orphans (vehicles without trips) get assigned to the first
--    ADMIN user, which must exist before this migration runs.
UPDATE "Vehicle"
SET "userId" = (
  SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "userId" IS NULL;

-- 4. Enforce NOT NULL + FK.
ALTER TABLE "Vehicle" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. License plate is now unique *per user* instead of globally.
ALTER TABLE "Vehicle" DROP CONSTRAINT IF EXISTS "Vehicle_licensePlate_key";
DROP INDEX IF EXISTS "Vehicle_licensePlate_key";
CREATE UNIQUE INDEX "Vehicle_userId_licensePlate_key"
  ON "Vehicle"("userId", "licensePlate");
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");

-- 6. Drop fuel column (user-requested in Phase 3).
ALTER TABLE "Trip" DROP COLUMN "fuelLiters";

-- 7. Trip → Vehicle FK: Cascade would let a vehicle delete silently take its
--    trips with it; Phase 3 requires the user to delete trips first.
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_vehicleId_fkey";
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
