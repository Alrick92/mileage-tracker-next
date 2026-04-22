import en from "@/i18n/en.json";
import fr from "@/i18n/fr.json";

export type Locale = "EN" | "FR";

const dictionaries: Record<Locale, Record<string, string>> = {
  EN: en as Record<string, string>,
  FR: fr as Record<string, string>,
};

export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const template =
    dictionaries[locale][key] ?? dictionaries.EN[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_m, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}

export function translator(locale: Locale) {
  return (key: string, vars?: Record<string, string | number>) =>
    t(locale, key, vars);
}

export function localeTag(locale: Locale): string {
  return locale === "FR" ? "fr-FR" : "en-US";
}
