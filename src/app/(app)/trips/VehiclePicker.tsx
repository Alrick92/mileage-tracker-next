"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  CarIcon,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  SearchIcon,
} from "@/components/icons";

import type { TripFormVehicle } from "./TripForm";

/** Up to this many vehicles are shown as tappable cards; more use the sheet. */
const CARD_LIMIT = 4;
/** How many recently used vehicles to pin above the full list. */
const RECENT_LIMIT = 3;

export type VehiclePickerLabels = {
  vehicle: string;
  select: string;
  sheetTitle: string;
  change: string;
  search: string;
  recent: string;
  all: string;
  noResults: string;
  close: string;
  required: string;
  last: string;
};

/** Lowercase, strip accents and punctuation so "abc123" matches "ABC-123". */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Vehicle selector that scales with fleet size:
 * - 1 vehicle: shown as a fixed row (nothing to choose)
 * - 2–4: tappable radio cards
 * - 5+: the current vehicle plus a searchable sheet (full-screen on phones,
 *   a dialog on desktop) with recently used vehicles pinned on top.
 */
export function VehiclePicker({
  vehicles,
  value,
  onChange,
  labels,
}: {
  vehicles: TripFormVehicle[];
  value: string;
  onChange: (id: string) => void;
  labels: VehiclePickerLabels;
}) {
  if (vehicles.length === 1) {
    const v = vehicles[0];
    return (
      <div>
        <p className="text-sm font-medium text-zinc-800">{labels.vehicle}</p>
        <input type="hidden" name="vehicleId" value={v.id} />
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5">
          <VehicleRowContent vehicle={v} lastLabel={labels.last} selected />
        </div>
      </div>
    );
  }

  if (vehicles.length <= CARD_LIMIT) {
    return (
      <fieldset>
        <legend className="text-sm font-medium text-zinc-800">
          {labels.vehicle}
          <Required />
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {vehicles.map((v) => (
            <label
              key={v.id}
              className="group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 transition select-none active:scale-[0.99] has-checked:border-zinc-900 has-checked:bg-zinc-50 has-checked:ring-1 has-checked:ring-zinc-900 has-focus-visible:ring-2 has-focus-visible:ring-zinc-900/40"
            >
              <input
                type="radio"
                name="vehicleId"
                value={v.id}
                required
                checked={value === v.id}
                onChange={() => onChange(v.id)}
                className="sr-only"
              />
              <VehicleRowContent
                vehicle={v}
                lastLabel={labels.last}
                selected={value === v.id}
              />
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-transparent transition group-has-checked:border-zinc-900 group-has-checked:bg-zinc-900 group-has-checked:text-white"
              >
                <CheckIcon width={14} height={14} strokeWidth={2.6} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <SearchableVehiclePicker
      vehicles={vehicles}
      value={value}
      onChange={onChange}
      labels={labels}
    />
  );
}

function SearchableVehiclePicker({
  vehicles,
  value,
  onChange,
  labels,
}: {
  vehicles: TripFormVehicle[];
  value: string;
  onChange: (id: string) => void;
  labels: VehiclePickerLabels;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [showRequired, setShowRequired] = useState(false);

  const selected = vehicles.find((v) => v.id === value) ?? null;

  const searchIndex = useMemo(
    () =>
      new Map(
        vehicles.map((v) => [
          v.id,
          {
            name: normalize(v.name),
            all: normalize(
              [v.name, v.licensePlate, v.description].filter(Boolean).join(" "),
            ),
          },
        ]),
      ),
    [vehicles],
  );

  const recent = useMemo(
    () =>
      vehicles
        .filter((v) => v.lastUsedAt !== null)
        .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
        .slice(0, RECENT_LIMIT),
    [vehicles],
  );

  const q = normalize(query);
  const sections: { title: string; items: TripFormVehicle[] }[] = q
    ? [
        {
          title: "",
          items: vehicles
            .filter((v) => searchIndex.get(v.id)!.all.includes(q))
            // Name-prefix matches first, then alphabetical (input order).
            .sort(
              (a, b) =>
                Number(!searchIndex.get(a.id)!.name.startsWith(q)) -
                Number(!searchIndex.get(b.id)!.name.startsWith(q)),
            ),
        },
      ]
    : [
        ...(recent.length > 0 ? [{ title: labels.recent, items: recent }] : []),
        {
          title: labels.all,
          items: vehicles.filter((v) => !recent.includes(v)),
        },
      ];
  const resultCount = sections.reduce((n, s) => n + s.items.length, 0);

  function open() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setQuery("");
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    // On touch screens, don't pop the keyboard over a short list; with a
    // mouse/keyboard, or a long list, jump straight into search.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!coarse || vehicles.length > 8) searchRef.current?.focus();
  }

  function close() {
    dialogRef.current?.close();
  }

  function pick(vehicleId: string) {
    onChange(vehicleId);
    setShowRequired(false);
    close();
  }

  function onOptionClick(e: React.MouseEvent<HTMLButtonElement>) {
    const vehicleId = e.currentTarget.dataset.vehicleId;
    if (vehicleId) pick(vehicleId);
  }

  // Make sure the scroll lock is released if we unmount while open.
  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  function focusOption(direction: 1 | -1 | "first") {
    const options = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>("[data-option]") ??
        [],
    );
    if (options.length === 0) return;
    if (direction === "first") {
      options[0].focus();
      return;
    }
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = current + direction;
    if (next < 0) searchRef.current?.focus();
    else options[Math.min(next, options.length - 1)].focus();
  }

  return (
    <div>
      <p id={`${id}-label`} className="text-sm font-medium text-zinc-800">
        {labels.vehicle}
        <Required />
      </p>

      {/* Carries the value and participates in native required validation;
          visually hidden because the trigger button below is the UI. */}
      <input
        name="vehicleId"
        value={value}
        required
        onChange={() => {}}
        onInvalid={(e) => {
          e.preventDefault();
          setShowRequired(true);
          // Let the browser finish validating the other fields first; a
          // modal opened mid-pass makes them unfocusable.
          window.setTimeout(open, 0);
        }}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={showRequired ? `${id}-error` : undefined}
        className={`mt-2 flex w-full items-center gap-3 rounded-2xl border bg-white p-3.5 text-left transition active:scale-[0.99] ${
          showRequired
            ? "border-red-400 ring-1 ring-red-400"
            : selected
              ? "border-zinc-900 ring-1 ring-zinc-900"
              : "border-zinc-300 border-dashed"
        }`}
      >
        <span id={`${id}-value`} className="contents">
          {selected ? (
            <VehicleRowContent
              vehicle={selected}
              lastLabel={labels.last}
              selected
              compact
            />
          ) : (
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                <CarIcon />
              </span>
              <span className="flex-1 text-sm font-medium text-zinc-500">
                {labels.select}
              </span>
            </>
          )}
        </span>
        <span className="flex h-8 shrink-0 items-center gap-0.5 rounded-full bg-zinc-100 px-2 text-xs font-semibold text-zinc-700 sm:pl-3">
          <span className="max-sm:sr-only">{labels.change}</span>
          <ChevronRightIcon width={16} height={16} />
        </span>
      </button>
      {showRequired ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs font-medium text-red-600"
        >
          {labels.required}
        </p>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        onClose={() => {
          document.documentElement.style.overflow = "";
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-white p-0 text-zinc-900 open:animate-sheet-up sm:m-auto sm:h-auto sm:max-h-[min(36rem,85dvh)] sm:max-w-md sm:rounded-2xl sm:shadow-2xl sm:open:animate-fade-in"
      >
        <div className="flex h-full max-h-[inherit] flex-col">
          <div className="pt-safe shrink-0 border-b border-zinc-100">
            <div className="flex items-center justify-between gap-3 px-4 pt-3">
              <h2 id={`${id}-title`} className="text-base font-semibold">
                {labels.sheetTitle}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label={labels.close}
                className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 active:scale-95"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="relative mx-4 mt-2 mb-3">
              <SearchIcon
                width={18}
                height={18}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
              />
              <input
                ref={searchRef}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    focusOption("first");
                  } else if (e.key === "Enter") {
                    // Enter picks the top match.
                    e.preventDefault();
                    const first = sections.find((s) => s.items.length)?.items[0];
                    if (first) pick(first.id);
                  }
                }}
                placeholder={labels.search}
                aria-label={labels.search}
                aria-controls={`${id}-list`}
                className="block w-full rounded-xl border-0 bg-zinc-100 py-3 pr-3 pl-10 text-sm text-zinc-900 placeholder:text-zinc-500 focus:bg-white focus:ring-2 focus:ring-zinc-900/15 focus:outline-none"
              />
            </div>
          </div>

          <div
            ref={listRef}
            id={`${id}-list`}
            className="pb-safe min-h-0 flex-1 overflow-y-auto overscroll-contain"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                focusOption(1);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                focusOption(-1);
              }
            }}
          >
            <p className="sr-only" aria-live="polite">
              {query ? `${resultCount}` : ""}
            </p>
            {resultCount === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-500">
                {labels.noResults}
              </p>
            ) : (
              sections.map((section) =>
                section.items.length === 0 ? null : (
                  <div key={section.title || "results"} className="py-1">
                    {section.title ? (
                      <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        {section.title}
                      </p>
                    ) : null}
                    <ul>
                      {section.items.map((v) => {
                        const isSelected = v.id === value;
                        return (
                          <li key={v.id}>
                            <button
                              type="button"
                              data-option
                              data-vehicle-id={v.id}
                              onClick={onOptionClick}
                              aria-current={isSelected || undefined}
                              className={`flex min-h-16 w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-50 focus-visible:bg-zinc-100 focus-visible:outline-none active:bg-zinc-100 ${
                                isSelected ? "bg-zinc-50" : ""
                              }`}
                            >
                              <VehicleRowContent
                                vehicle={v}
                                lastLabel={labels.last}
                                selected={isSelected}
                              />
                              {isSelected ? (
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                                  <CheckIcon
                                    width={14}
                                    height={14}
                                    strokeWidth={2.6}
                                  />
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ),
              )
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}

function VehicleRowContent({
  vehicle,
  lastLabel,
  selected,
  compact = false,
}: {
  vehicle: TripFormVehicle;
  lastLabel: string;
  selected: boolean;
  /** Hide the year/make/model to keep a single-row summary uncluttered. */
  compact?: boolean;
}) {
  return (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
          selected ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
        }`}
      >
        <CarIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-zinc-900">
          {vehicle.name}
          {vehicle.description && !compact ? (
            <span className="ml-1.5 font-normal text-zinc-500">
              {vehicle.description}
            </span>
          ) : null}
        </span>
        <span className="block truncate text-xs text-zinc-500">
          {vehicle.licensePlate ? (
            <span className="font-mono">{vehicle.licensePlate} · </span>
          ) : null}
          {lastLabel}{" "}
          <span className="font-mono">{vehicle.currentOdometerDisplay}</span>
        </span>
      </span>
    </>
  );
}

function Required() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-red-500">
      *
    </span>
  );
}
