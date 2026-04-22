-- Multi-driver vehicle assignments.
--
-- Replaces Vehicle.userId (1:1 owner) with a VehicleAssignment join table so
-- one vehicle can be driven by many users and one user can drive many
-- vehicles. Only admins should mutate assignments post-migration (enforced in
-- application code). Vehicle.currentOdometer remains the single source of
-- truth and is updated by any assigned driver's trip.

-- 1. Create the join table.
CREATE TABLE "VehicleAssignment" (
    "id"        TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VehicleAssignment_vehicleId_userId_key"
    ON "VehicleAssignment"("vehicleId", "userId");
CREATE INDEX "VehicleAssignment_userId_idx"
    ON "VehicleAssignment"("userId");
CREATE INDEX "VehicleAssignment_vehicleId_idx"
    ON "VehicleAssignment"("vehicleId");

ALTER TABLE "VehicleAssignment"
    ADD CONSTRAINT "VehicleAssignment_vehicleId_fkey"
    FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleAssignment"
    ADD CONSTRAINT "VehicleAssignment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Backfill: every existing Vehicle → one VehicleAssignment row for its
--    current owner. md5() gives a non-colliding 25-char id (matches cuid's
--    length roughly, though prefix distinguishes backfill rows).
INSERT INTO "VehicleAssignment" ("id", "vehicleId", "userId", "createdAt")
SELECT
    'va_' || substring(md5(random()::text || clock_timestamp()::text || v."id"), 1, 25),
    v."id",
    v."userId",
    v."createdAt"
FROM "Vehicle" v;

-- 3. Drop the old 1:1 owner column and its indexes/constraints.
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_userId_fkey";
DROP INDEX IF EXISTS "Vehicle_userId_licensePlate_key";
DROP INDEX IF EXISTS "Vehicle_userId_idx";
ALTER TABLE "Vehicle" DROP COLUMN "userId";
