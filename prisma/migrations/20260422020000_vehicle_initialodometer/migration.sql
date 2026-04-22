-- Adds Vehicle.initialOdometer to preserve the odometer reading at creation
-- time, so deleteTripAction can safely floor currentOdometer back to the
-- initial value when the last/high-water-mark trip is removed (instead of
-- resetting to 0 and losing the initial calibration).

ALTER TABLE "Vehicle" ADD COLUMN "initialOdometer" INTEGER NOT NULL DEFAULT 0;

-- For pre-existing vehicles we don't have the creation-time value, so seed
-- initialOdometer with the *minimum* of either the earliest trip's
-- startOdometer (if any trips exist) or the current currentOdometer
-- (otherwise). This approximates the original calibration: a vehicle whose
-- first trip started at 50000 was presumably created at >= 50000 km.
UPDATE "Vehicle" v
SET "initialOdometer" = COALESCE(
  (
    SELECT MIN(t."startOdometer")
    FROM "Trip" t
    WHERE t."vehicleId" = v.id
  ),
  v."currentOdometer"
);
