"use client";

import {
  useActionState,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { AlertIcon } from "@/components/icons";
import { buttonStyles, inputStyles } from "@/components/ui";

import {
  createTripAction,
  updateTripAction,
  type TripFormState,
} from "./actions";
import { VehiclePicker, type VehiclePickerLabels } from "./VehiclePicker";

export type TripFormVehicle = {
  id: string;
  name: string;
  licensePlate: string | null;
  /** "2022 Ford Transit", used for display and search. */
  description: string | null;
  /** Epoch ms of this user's most recent trip on the vehicle, if any. */
  lastUsedAt: number | null;
  currentOdometerDisplay: string;
  // Default start odometer in the user's unit, taken from the most recent
  // trip's end odometer (or the vehicle's current odometer if no trips).
  defaultStartOdometer: number;
};

const initialState: TripFormState = {};

export type TripFormLabels = {
  vehiclePicker: VehiclePickerLabels;
  date: string;
  today: string;
  yesterday: string;
  driver: string;
  startOdometer: string;
  endOdometer: string;
  startPrefillHelp: string;
  distance: string;
  distanceField: string;
  distanceHelp: string;
  distanceUnit: string;
  /** BCP-47 tag used to format numbers, e.g. "fr-FR". */
  numberLocale: string;
  endBeforeStart: string;
  notes: string;
  notesPlaceholder: string;
  save: string;
  saving: string;
  cancel: string;
};

export type TripFormInitialValues = {
  tripId: string;
  vehicleId: string;
  driverName: string;
  date: string;
  startOdometer: number;
  endOdometer: number;
  notes: string;
};

/** YYYY-MM-DD for a date in the browser's local time zone. */
function localIsoDate(d: Date): string {
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

/** Adds `days` to a YYYY-MM-DD string (calendar arithmetic, DST-safe). */
function shiftIsoDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const subscribeNever = () => () => {};

function parseWhole(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function TripForm({
  vehicles,
  defaultVehicleId,
  defaultDriverName,
  labels,
  mode = "create",
  initialValues,
  cancelHref = "/trips",
}: {
  vehicles: TripFormVehicle[];
  defaultVehicleId?: string;
  defaultDriverName?: string;
  labels: TripFormLabels;
  mode?: "create" | "edit";
  initialValues?: TripFormInitialValues;
  cancelHref?: string;
}) {
  const [state, action] = useActionState(
    mode === "edit" ? updateTripAction : createTripAction,
    initialState,
  );

  const vehiclesById = useMemo(
    () => new Map(vehicles.map((v) => [v.id, v])),
    [vehicles],
  );

  // Pre-select the requested vehicle, or the only one if there is just one.
  const initialVehicleId =
    initialValues?.vehicleId ??
    (defaultVehicleId && vehiclesById.has(defaultVehicleId)
      ? defaultVehicleId
      : vehicles.length === 1
        ? vehicles[0].id
        : "");

  const [vehicleId, setVehicleId] = useState(initialVehicleId);
  const [start, setStart] = useState<string>(() => {
    if (initialValues) return String(initialValues.startOdometer);
    const v = vehiclesById.get(initialVehicleId);
    return v ? String(v.defaultStartOdometer) : "";
  });
  const [end, setEnd] = useState<string>(
    initialValues ? String(initialValues.endOdometer) : "",
  );
  // The distance field is a second way to enter the end reading. We remember
  // which of the two the user typed into last so changing the start reading
  // keeps their intent (fixed distance vs fixed end reading).
  const [distanceText, setDistanceText] = useState("");
  const [lastEdited, setLastEdited] = useState<"end" | "distance">("end");

  // The user's local "today" is only known in the browser. During SSR and
  // hydration this is null (so markup matches), then React re-renders with
  // the real value. Until the user picks a date, the field follows it.
  const todayIso = useSyncExternalStore(
    subscribeNever,
    () => localIsoDate(new Date()),
    () => null,
  );
  const [pickedDate, setPickedDate] = useState<string | null>(
    initialValues?.date ?? null,
  );
  const date =
    pickedDate ?? todayIso ?? new Date().toISOString().slice(0, 10);
  const yesterdayIso = todayIso ? shiftIsoDate(todayIso, -1) : null;

  const startNum = parseWhole(start);
  const endNum = parseWhole(end);
  const distance =
    startNum !== null && endNum !== null ? endNum - startNum : null;
  const endBeforeStart = distance !== null && distance < 0;
  const distanceValue =
    lastEdited === "distance"
      ? distanceText
      : distance !== null && distance >= 0
        ? String(distance)
        : "";

  function onVehicleChange(id: string) {
    setVehicleId(id);
    // Only auto-prefill the start reading when creating, so editing a trip
    // never silently rewrites the user's original numbers.
    if (mode !== "create") return;
    const v = vehiclesById.get(id);
    const nextStart = v ? String(v.defaultStartOdometer) : "";
    onStartChange(nextStart);
  }

  function onStartChange(value: string) {
    setStart(value);
    if (lastEdited === "distance") {
      const s = parseWhole(value);
      const d = parseWhole(distanceText);
      setEnd(s !== null && d !== null ? String(s + d) : "");
    }
  }

  function onEndChange(value: string) {
    setEnd(value);
    setLastEdited("end");
  }

  function onDistanceChange(value: string) {
    setDistanceText(value);
    setLastEdited("distance");
    const s = parseWhole(start);
    const d = parseWhole(value);
    setEnd(s !== null && d !== null ? String(s + d) : "");
  }

  function pickDate(value: string) {
    setPickedDate(value);
  }

  const distanceSummary =
    distance !== null && distance >= 0
      ? `${distance.toLocaleString(labels.numberLocale)} ${labels.distanceUnit}`
      : "—";

  return (
    <form action={action} className="space-y-6">
      {mode === "edit" && initialValues ? (
        <input type="hidden" name="tripId" value={initialValues.tripId} />
      ) : null}

      <VehiclePicker
        vehicles={vehicles}
        value={vehicleId}
        onChange={onVehicleChange}
        labels={labels.vehiclePicker}
      />

      {/* Odometer */}
      <div className="space-y-4 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/70 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="startOdometer" required>
              {labels.startOdometer}
            </FieldLabel>
            <OdometerInput
              id="startOdometer"
              name="startOdometer"
              value={start}
              onChange={onStartChange}
              describedBy="startOdometer-help"
            />
            <p id="startOdometer-help" className="mt-1.5 text-xs text-zinc-500">
              {labels.startPrefillHelp}
            </p>
          </div>
          <div>
            <FieldLabel htmlFor="endOdometer" required>
              {labels.endOdometer}
            </FieldLabel>
            <OdometerInput
              id="endOdometer"
              name="endOdometer"
              value={end}
              onChange={onEndChange}
              min={startNum ?? 0}
              invalid={endBeforeStart}
              describedBy={endBeforeStart ? "endOdometer-error" : undefined}
              emphasis
            />
            {endBeforeStart ? (
              <p
                id="endOdometer-error"
                className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600"
              >
                <AlertIcon width={14} height={14} />
                {labels.endBeforeStart}
              </p>
            ) : null}
          </div>
        </div>

        <div className="relative flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200" />
          {labels.distanceHelp}
          <span className="h-px flex-1 bg-zinc-200" />
        </div>

        <div>
          <FieldLabel htmlFor="tripDistance">{labels.distanceField}</FieldLabel>
          {/* No `name`: the server derives distance from the two readings. */}
          <OdometerInput
            id="tripDistance"
            value={distanceValue}
            onChange={onDistanceChange}
            placeholder="0"
          />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="date" required>
            {labels.date}
          </FieldLabel>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={date}
            onChange={(e) => pickDate(e.target.value)}
            className={`${inputStyles} appearance-none`}
          />
          {todayIso && yesterdayIso ? (
            <div className="mt-2 flex gap-2">
              <DateChip
                label={labels.today}
                active={date === todayIso}
                onClick={() => pickDate(todayIso)}
              />
              <DateChip
                label={labels.yesterday}
                active={date === yesterdayIso}
                onClick={() => pickDate(yesterdayIso)}
              />
            </div>
          ) : null}
        </div>
        <div>
          <FieldLabel htmlFor="driverName" required>
            {labels.driver}
          </FieldLabel>
          <input
            id="driverName"
            name="driverName"
            required
            autoComplete="name"
            defaultValue={initialValues?.driverName ?? defaultDriverName}
            className={inputStyles}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="notes">{labels.notes}</FieldLabel>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder={labels.notesPlaceholder}
            defaultValue={initialValues?.notes ?? ""}
            className={`${inputStyles} resize-y`}
          />
        </div>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertIcon width={18} height={18} className="mt-px shrink-0" />
          {state.error}
        </p>
      ) : null}

      {/* Sticky on mobile so the save button is always one thumb-tap away. */}
      <div className="pb-safe sticky bottom-0 z-10 -mx-4 -mb-4 rounded-b-2xl border-t border-zinc-200/70 bg-white/90 px-4 pt-3 backdrop-blur-xl sm:-mx-6 sm:-mb-6 sm:px-6 md:static md:m-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="flex items-center gap-3 pb-3 md:pb-0">
          <div className="min-w-0 md:hidden">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              {labels.distance}
            </p>
            <p
              aria-live="polite"
              className="truncate font-mono text-lg font-semibold text-zinc-900"
            >
              {distanceSummary}
            </p>
          </div>
          <Link
            href={cancelHref}
            className={`${buttonStyles.ghost} max-md:hidden`}
          >
            {labels.cancel}
          </Link>
          <Submit
            label={labels.save}
            pendingLabel={labels.saving}
            className="ml-auto min-w-36 flex-1 md:order-first md:ml-0 md:flex-none"
          />
          <p className="ml-auto hidden text-sm text-zinc-500 md:block">
            {labels.distance}:{" "}
            <span className="font-mono font-medium text-zinc-900">
              {distanceSummary}
            </span>
          </p>
        </div>
      </div>
    </form>
  );
}

function Submit({
  label,
  pendingLabel,
  className = "",
}: {
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonStyles.primary} min-h-12 text-base md:min-h-10 md:text-sm ${className}`}
    >
      {pending ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
        />
      ) : null}
      {pending ? pendingLabel : label}
    </button>
  );
}

function Required() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-red-500">
      *
    </span>
  );
}

function FieldLabel({
  htmlFor,
  required = false,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-800">
      {children}
      {required ? <Required /> : null}
    </label>
  );
}

function OdometerInput({
  id,
  name,
  value,
  onChange,
  min = 0,
  invalid = false,
  describedBy,
  placeholder,
  emphasis = false,
}: {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
  emphasis?: boolean;
}) {
  return (
    <input
      id={id}
      name={name}
      type="number"
      inputMode="numeric"
      pattern="[0-9]*"
      enterKeyHint="next"
      autoComplete="off"
      required={Boolean(name)}
      min={min}
      step="1"
      value={value}
      placeholder={placeholder}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      className={`${inputStyles} font-mono tabular-nums ${
        emphasis
          ? "text-lg! font-semibold md:text-base!"
          : "text-base! md:text-sm!"
      } ${
        invalid
          ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
          : ""
      }`}
    />
  );
}

function DateChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-9 rounded-full border px-3.5 text-xs font-medium transition active:scale-95 ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}
