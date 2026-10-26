import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { plural, t } from "@/lib/i18n/format";
import { formatMoney, formatUsd, formatUsdRate, uzsToUsd } from "@/lib/money";

interface OrderSummaryProps {
  locale: Locale;
  dict: Dictionary;
  itemCount: number;
  subtotal: number;
  children?: ReactNode;
  pending?: boolean;
  /** Курс USD → UZS: показываем ориентир в долларах, списание — в сумах. */
  usdRate?: number | null;
}

export function OrderSummary({ locale, dict, itemCount, subtotal, children, pending, usdRate }: OrderSummaryProps) {
  return (
    <section
      aria-labelledby="order-summary"
      aria-busy={pending}
      className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6"
    >
      <h2 id="order-summary" className="font-display text-lg font-semibold">
        {dict.cart.summary}
      </h2>
      <dl className="flex flex-col gap-3 text-[15px]">
        <div className="flex justify-between gap-4">
          <dt className="text-text-muted">
            {dict.cart.subtotal} ({plural(locale, itemCount, dict.cart.items)})
          </dt>
          <dd className="font-medium tabular-nums">{formatMoney(subtotal, locale)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-muted">{dict.cart.delivery}</dt>
          <dd className="text-right">{dict.cart.deliveryValue}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
          <dt className="font-semibold">{dict.cart.total}</dt>
          <dd className="font-display text-2xl font-semibold text-price tabular-nums">
            {formatMoney(subtotal, locale)}
          </dd>
        </div>
        {usdRate && (
          <p className="-mt-1 text-right text-[13px] text-text-muted tabular-nums">
            {t(dict.cart.usdApprox, { usd: formatUsd(uzsToUsd(subtotal, usdRate), locale), rate: formatUsdRate(usdRate, locale) })}
          </p>
        )}
      </dl>
      {children}
    </section>
  );
}
