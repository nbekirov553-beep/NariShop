"use client";

import { InfoIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/catalog/category-icon";
import { QuantityControl } from "@/components/product/quantity-control";
import { buttonStyles } from "@/components/ui/button";
import { useCart } from "@/features/cart/store";
import { useCartQuote } from "@/features/cart/use-cart-quote";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/format";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { CartEmpty, CartError, CartSkeleton } from "./cart-states";
import { OrderSummary } from "./order-summary";

export function CartView() {
  const { locale, dict } = useI18n();
  const { status, quote, lines, removedMissing, retry } = useCartQuote();
  const setQuantity = useCart((state) => state.setQuantity);
  const remove = useCart((state) => state.remove);

  if (status === "empty") return <CartEmpty />;
  if (status === "error" && !quote) return <CartError onRetry={retry} />;
  if (!quote) return <CartSkeleton />;

  const pending = status === "loading";
  const blocked = lines.some((line) => line.issue === "out_of_stock");

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-3">
        {removedMissing && (
          <p role="status" className="flex items-start gap-2 rounded-[var(--radius-field)] bg-warning-soft px-4 py-3 text-sm text-warning">
            <InfoIcon size={18} weight="bold" aria-hidden className="mt-0.5 shrink-0" />
            {dict.cart.missingRemoved}
          </p>
        )}
        {status === "error" && <CartError onRetry={retry} />}
        <ul aria-busy={pending} className={cn("flex flex-col gap-3 transition-opacity", pending && "opacity-60")}>
          {lines.map((line) => {
            const href = localePath(locale, `/product/${line.slug}`);
            const name = line.name[locale];
            return (
              <li
                key={line.productId}
                className="animate-in-up grid grid-cols-[5rem_1fr] gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:grid-cols-[6rem_1fr]"
              >
                <Link
                  href={href}
                  tabIndex={-1}
                  aria-hidden
                  className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[var(--radius-field)] bg-photo text-text-muted"
                >
                  {line.imageUrl ? (
                    <Image src={line.imageUrl} alt="" fill sizes="6rem" className="object-cover" />
                  ) : (
                    <CategoryIcon icon={line.categoryIcon} size={40} weight="duotone" />
                  )}
                </Link>
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <Link href={href} className="text-[15px] font-medium leading-snug hover:underline">
                        {name}
                      </Link>
                      <span className="text-[13px] text-text-muted">
                        {dict.product.sku}: {line.sku}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      aria-label={t(dict.cart.removeItem, { name })}
                      className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-pill)] text-text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <TrashIcon size={18} aria-hidden />
                    </button>
                  </div>

                  {line.issue && (
                    <p className="flex items-start gap-1.5 text-[13px] font-medium text-warning">
                      <WarningCircleIcon size={16} weight="bold" aria-hidden className="mt-px shrink-0" />
                      {line.issue === "out_of_stock"
                        ? dict.cart.outOfStock
                        : t(dict.cart.quantityReduced, { count: line.availableQuantity })}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {line.availableQuantity > 0 ? (
                      <QuantityControl
                        value={line.quantity}
                        max={line.availableQuantity}
                        onChange={(value) => setQuantity(line.productId, Math.min(value, line.availableQuantity))}
                        labels={dict.product}
                        size="sm"
                      />
                    ) : (
                      <span className="text-sm text-text-muted">{dict.product.outOfStock}</span>
                    )}
                    <div className="flex flex-col items-end">
                      <span className="font-display text-lg font-semibold tabular-nums">
                        {formatMoney(line.lineTotalUzs, locale)}
                      </span>
                      {line.quantity > 1 && (
                        <span className="text-[13px] text-text-muted tabular-nums">
                          {line.quantity} × {formatMoney(line.unitPriceUzs, locale)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="lg:sticky lg:top-28">
        <OrderSummary
          locale={locale}
          dict={dict}
          itemCount={quote.itemCount}
          subtotal={quote.subtotalUzs}
          pending={pending}
        >
          <div className="flex flex-col gap-2">
            {blocked || pending ? (
              <span aria-disabled className={buttonStyles({ size: "lg", full: true, className: "pointer-events-none opacity-50" })}>
                {dict.cart.checkout}
              </span>
            ) : (
              <Link href={localePath(locale, "/checkout")} className={buttonStyles({ size: "lg", full: true })}>
                {dict.cart.checkout}
              </Link>
            )}
            <Link
              href={localePath(locale, "/catalog")}
              className={buttonStyles({ variant: "ghost", full: true })}
            >
              {dict.cart.continueShopping}
            </Link>
          </div>
        </OrderSummary>
      </div>
    </div>
  );
}
