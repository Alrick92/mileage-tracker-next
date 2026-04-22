import { localeTag, t, type Locale } from "@/lib/i18n";

export type Unit = "KM" | "MI";

const KM_PER_MI = 1.609344;

export function kmToUnit(km: number, unit: Unit): number {
  return unit === "KM" ? km : km / KM_PER_MI;
}

export function unitToKm(value: number, unit: Unit): number {
  return unit === "KM" ? value : value * KM_PER_MI;
}

export function unitShort(unit: Unit, locale: Locale): string {
  return t(locale, unit === "KM" ? "unit.km.short" : "unit.mi.short");
}

/** Format a km value for display in the user's chosen unit + locale. */
export function formatDistance(
  km: number,
  unit: Unit,
  locale: Locale,
): string {
  const value = Math.round(kmToUnit(km, unit));
  return `${value.toLocaleString(localeTag(locale))} ${unitShort(unit, locale)}`;
}

/** Format an odometer value (stored as km) for display. */
export function formatOdometer(
  km: number,
  unit: Unit,
  locale: Locale,
): string {
  return formatDistance(km, unit, locale);
}

/** Format an odometer as just the number (no unit suffix) for table cells. */
export function formatOdometerNumber(
  km: number,
  unit: Unit,
  locale: Locale,
): string {
  const value = Math.round(kmToUnit(km, unit));
  return value.toLocaleString(localeTag(locale));
}

/** Parse a user-entered odometer in their chosen unit to canonical km. */
export function parseOdometerToKm(input: number, unit: Unit): number {
  return Math.round(unitToKm(input, unit));
}
