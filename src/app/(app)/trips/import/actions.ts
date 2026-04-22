"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";
import { parseOdometerToKm, type Unit } from "@/lib/units";

export type ImportRowError = { row: number; message: string };

export type ImportTripsState = {
  error?: string;
  imported?: number;
  skipped?: number;
  rowErrors?: ImportRowError[];
};

const EXPORT_HEADER_ALIASES: Record<string, string> = {
  date: "date",
  vehicle: "vehicle",
  véhicule: "vehicle",
  "license plate": "licensePlate",
  "plaque d'immatriculation": "licensePlate",
  plate: "licensePlate",
  driver: "driver",
  conducteur: "driver",
  start: "start",
  début: "start",
  end: "end",
  fin: "end",
  distance: "distance",
  notes: "notes",
  owner: "owner",
  propriétaire: "owner",
};

function normalizeHeader(raw: string): string {
  const base = raw.trim().toLowerCase();
  const stripped = base.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return EXPORT_HEADER_ALIASES[stripped] ?? stripped;
}

export async function importTripsAction(
  _prev: ImportTripsState,
  formData: FormData,
): Promise<ImportTripsState> {
  const user = await requireUser();
  const unit = user.unit as Unit;

  const vehicleIdRaw = formData.get("vehicleId");
  const vehicleId =
    typeof vehicleIdRaw === "string" ? vehicleIdRaw.trim() : "";
  if (!vehicleId) {
    return { error: "Please select a vehicle to import these trips into." };
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId: user.id },
    select: { id: true, currentOdometer: true },
  });
  if (!vehicle) {
    return { error: "Selected vehicle was not found in your fleet." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a CSV file to import." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "CSV file is too large (max 5 MB)." };
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { error: "CSV is empty." };
  }

  const headerRow = rows[0].map(normalizeHeader);
  const colIndex = (name: string) => headerRow.indexOf(name);

  const required = ["date", "start", "end"] as const;
  const missing = required.filter((r) => colIndex(r) === -1);
  if (missing.length > 0) {
    return {
      error: `CSV is missing required column(s): ${missing.join(", ")}. Required columns: Date, Start, End. Notes is optional.`,
    };
  }

  const iDate = colIndex("date");
  const iStart = colIndex("start");
  const iEnd = colIndex("end");
  const iNotes = colIndex("notes");

  const driverName = (user.name ?? "").trim() || user.email;

  const dataRows = rows.slice(1);
  if (dataRows.length === 0) {
    return { error: "CSV has headers but no data rows." };
  }

  type ValidRow = {
    rowNumber: number;
    date: Date;
    startOdometerKm: number;
    endOdometerKm: number;
    notes: string | null;
  };

  const valid: ValidRow[] = [];
  const rowErrors: ImportRowError[] = [];

  dataRows.forEach((cells, idx) => {
    const rowNumber = idx + 2;
    const pushError = (message: string) =>
      rowErrors.push({ row: rowNumber, message });

    const dateRaw = (cells[iDate] ?? "").trim();
    if (!dateRaw) {
      pushError("Date is required.");
      return;
    }
    const parsedDate = new Date(dateRaw);
    if (Number.isNaN(parsedDate.getTime())) {
      pushError(`Invalid date: "${dateRaw}" (expected YYYY-MM-DD).`);
      return;
    }

    const startRaw = (cells[iStart] ?? "").trim();
    const endRaw = (cells[iEnd] ?? "").trim();
    if (!startRaw) {
      pushError("Start odometer is required.");
      return;
    }
    if (!endRaw) {
      pushError("End odometer is required.");
      return;
    }
    const startNum = Number(startRaw);
    const endNum = Number(endRaw);
    if (!Number.isFinite(startNum) || startNum < 0) {
      pushError(`Invalid start odometer: "${startRaw}".`);
      return;
    }
    if (!Number.isFinite(endNum) || endNum < 0) {
      pushError(`Invalid end odometer: "${endRaw}".`);
      return;
    }
    if (endNum < startNum) {
      pushError(
        `End odometer (${endNum}) must be greater than or equal to start (${startNum}).`,
      );
      return;
    }

    const notesRaw = iNotes >= 0 ? (cells[iNotes] ?? "").trim() : "";
    if (notesRaw.length > 1000) {
      pushError("Notes too long (max 1000).");
      return;
    }

    valid.push({
      rowNumber,
      date: parsedDate,
      startOdometerKm: parseOdometerToKm(startNum, unit),
      endOdometerKm: parseOdometerToKm(endNum, unit),
      notes: notesRaw.length > 0 ? notesRaw : null,
    });
  });

  if (valid.length === 0) {
    return {
      error: "No valid rows to import.",
      imported: 0,
      skipped: rowErrors.length,
      rowErrors: rowErrors.slice(0, 50),
    };
  }

  let maxEnd = 0;
  for (const row of valid) {
    if (row.endOdometerKm > maxEnd) maxEnd = row.endOdometerKm;
  }

  await prisma.$transaction(async (tx) => {
    await tx.trip.createMany({
      data: valid.map((row) => ({
        vehicleId: vehicle.id,
        userId: user.id,
        driverName,
        date: row.date,
        startOdometer: row.startOdometerKm,
        endOdometer: row.endOdometerKm,
        notes: row.notes,
      })),
    });

    if (maxEnd > vehicle.currentOdometer) {
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { currentOdometer: maxEnd },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/vehicles");
  revalidatePath("/trips");

  return {
    imported: valid.length,
    skipped: rowErrors.length,
    rowErrors: rowErrors.slice(0, 50),
  };
}
