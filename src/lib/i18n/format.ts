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

export function plural(locale: Locale, count: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(pluralLocale[locale]).select(count);
  const template = rule in forms ? forms[rule as keyof PluralForms] : forms.other;
  return t(template, { count });
}
