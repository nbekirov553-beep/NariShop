import type { Locale } from "./config";

export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export interface PluralForms {
  one: string;
  few: string;
  many: string;
  other: string;
}

const pluralLocale: Record<Locale, string> = { uz: "uz", ru: "ru", en: "en" };

const dateLocale: Record<Locale, string> = { uz: "uz-Latn-UZ", ru: "ru-RU", en: "en-GB" };

/** Только для серверного рендера: время магазина — Ташкент, независимо от сервера. */
export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(dateLocale[locale], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tashkent",
  }).format(new Date(iso));
}

export function plural(locale: Locale, count: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(pluralLocale[locale]).select(count);
  const template = rule in forms ? forms[rule as keyof PluralForms] : forms.other;
  return t(template, { count });
}
