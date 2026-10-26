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

// Курс — сколько сумов стоит 1 доллар (`USD_UZS_RATE`). Доллары считаем в центах, чтобы не копить ошибки округления.

export function parseUsdRate(value: string | undefined): number | null {
  const rate = Number(value?.replace(/[\s_]/g, "").replace(",", "."));
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

/** Сумы → центы по курсу. */
export function uzsToUsd(amountUzs: number, rate: number): number {
  return Math.round((amountUzs * 100) / rate);
}

/** Центы → сумы по курсу (целое число сумов). */
export function usdToUzs(amountUsdCents: number, rate: number): number {
  return Math.round((amountUsdCents * rate) / 100);
}

export function formatUsd(amountUsdCents: number, locale: Locale): string {
  const sign = amountUsdCents < 0 ? "-" : "";
  const cents = Math.abs(Math.round(amountUsdCents));
  const whole = groupDigits(Math.trunc(cents / 100), locale === "en" ? "," : NBSP);
  const fraction = String(cents % 100).padStart(2, "0");
  return locale === "en" ? `${sign}$${whole}.${fraction}` : `${sign}${whole},${fraction}${NBSP}$`;
}

/** Курс для подписи «1 $ = 12 650 сум»; дробная часть курса округляется до сума. */
export function formatUsdRate(rate: number, locale: Locale): string {
  return `1${NBSP}$ = ${formatMoney(Math.round(rate), locale)}`;
}

export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function lineTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}
