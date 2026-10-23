import type { Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/format";
import { cn } from "@/lib/cn";
import { discountPercent, formatMoney } from "@/lib/money";

interface PriceBlockProps {
  price: number;
  compareAt: number | null;
  locale: Locale;
  labels: { oldPrice: string; discount: string };
  size?: "md" | "lg";
}

export function PriceBlock({ price, compareAt, locale, labels, size = "md" }: PriceBlockProps) {
  const percent = discountPercent(price, compareAt);
  return (
    <div className="@container">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-price",
            size === "lg"
              ? "text-3xl sm:text-4xl"
              : "text-base leading-snug @[11rem]:text-lg @[13rem]:text-xl",
          )}
        >
          {formatMoney(price, locale, { wrapCurrency: size === "md" })}
        </span>
        {percent !== null && compareAt !== null && (
          <>
            <span className={cn("text-text-muted line-through", size === "lg" ? "text-base" : "text-sm")}>
              <span className="sr-only">{labels.oldPrice}: </span>
              {formatMoney(compareAt, locale, { wrapCurrency: size === "md" })}
            </span>
            <span className="rounded-[var(--radius-pill)] bg-accent-soft px-2 py-0.5 text-xs font-semibold text-price">
              {t(labels.discount, { percent })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
