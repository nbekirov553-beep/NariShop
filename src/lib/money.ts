import type { Locale } from "@/lib/i18n/config";

const currencyLabel: Record<Locale, string> = {
  uz: "so‘m",
  ru: "сум",
  en: "UZS",
};

const NBSP = "\u00A0";

function groupDigits(value: number, separator: string): string {
  return Math.trunc(Math.abs(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

// Ручная группировка вместо Intl: одинаковый результат на сервере и в любом браузере.
export function formatMoney(
  amountUzs: number,
  locale: Locale,
  { wrapCurrency = false }: { wrapCurrency?: boolean } = {},
): string {
  if (!Number.isInteger(amountUzs)) {
    throw new Error("Money amounts must be integers");
  }
  const sign = amountUzs < 0 ? "-" : "";
  const currencySeparator = wrapCurrency ? " " : NBSP;
  const digitSeparator = locale === "en" ? "," : NBSP;
  return `${sign}${groupDigits(amountUzs, digitSeparator)}${currencySeparator}${currencyLabel[locale]}`;
}

export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function lineTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}
