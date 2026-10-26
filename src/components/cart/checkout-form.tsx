"use client";

import { CheckCircleIcon, InfoIcon, WarningCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { useCart } from "@/features/cart/store";
import { useCartQuote } from "@/features/cart/use-cart-quote";
import {
  checkoutSchema,
  deliveryMethods,
  paymentMethods,
  type CreatedOrder,
} from "@/features/orders/schema";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/format";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { CartEmpty, CartError, CartSkeleton } from "./cart-states";
import { OrderSummary } from "./order-summary";

type ErrorKey = keyof ReturnType<typeof useI18n>["dict"]["checkout"]["errors"];
type FieldErrors = Partial<Record<string, ErrorKey>>;

function RadioCard({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-field)] border bg-surface px-4 py-3 text-[15px] transition-colors",
        checked ? "border-accent ring-1 ring-accent" : "border-border hover:border-text-muted",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="size-4 shrink-0 accent-[var(--accent)]"
      />
      {children}
    </label>
  );
}

export interface CheckoutDefaults {
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
}

export function CheckoutForm({
  defaults,
  onlinePayment = false,
  usdRate = null,
}: {
  defaults?: CheckoutDefaults;
  onlinePayment?: boolean;
  usdRate?: number | null;
}) {
  const { locale, dict } = useI18n();
  const { status, quote, lines, items, retry } = useCartQuote();
  const clear = useCart((state) => state.clear);
  const [delivery, setDelivery] = useState<(typeof deliveryMethods)[number]>("courier");
  const [payment, setPayment] = useState<(typeof paymentMethods)[number]>("cash");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<ErrorKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  if (order) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-8 sm:p-12">
        <CheckCircleIcon size={48} weight="duotone" aria-hidden className="text-success" />
        <h2 className="font-display text-2xl font-semibold">{dict.checkout.successTitle}</h2>
        <p className="max-w-[55ch] text-[15px]">
          {t(dict.checkout.successText, { number: order.orderNumber })}
        </p>
        <p className="font-display text-xl font-semibold text-price">{formatMoney(order.totalUzs, locale)}</p>
        <p className="flex items-start gap-2 rounded-[var(--radius-field)] bg-warning-soft px-4 py-3 text-sm text-warning">
          <InfoIcon size={18} weight="bold" aria-hidden className="mt-0.5 shrink-0" />
          {dict.checkout.successDemo}
        </p>
        <p className="text-sm text-text-muted">{dict.checkout.successAccount}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={localePath(locale, "/catalog")} className={buttonStyles()}>
            {dict.checkout.toCatalog}
          </Link>
          <Link href={localePath(locale, "/account")} className={buttonStyles({ variant: "secondary" })}>
            {dict.checkout.toOrders}
          </Link>
        </div>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-8 text-[15px] font-medium">
        <span aria-hidden className="size-5 animate-spin rounded-full border-2 border-border border-t-accent" />
        {dict.checkout.redirectingToPayment}
      </div>
    );
  }

  if (status === "empty") return <CartEmpty />;
  if (status === "error" && !quote) return <CartError onRetry={retry} />;
  if (!quote) return <CartSkeleton />;

  const blocked = lines.some((line) => line.issue === "out_of_stock");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = checkoutSchema.safeParse({ ...data, deliveryMethod: delivery, paymentMethod: payment });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        next[field] ??= issue.message as ErrorKey;
      }
      setErrors(next);
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    setErrors({});
    setSubmitting(true);
    idempotencyKey.current ??= crypto.randomUUID();

    try {
      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          items,
          checkout: { ...data, deliveryMethod: delivery, paymentMethod: payment },
          locale,
        }),
      });
      const body = (await response.json()) as { data?: CreatedOrder; error?: { code: string } };
      if (response.ok && body.data?.paymentUrl) {
        // Статус оплаты подтвердит webhook; после оплаты Stripe вернёт на страницу результата.
        setRedirecting(true);
        clear();
        window.location.assign(body.data.paymentUrl);
        return;
      }
      if (response.ok && body.data) {
        setOrder(body.data);
        clear();
        window.scrollTo({ top: 0 });
        return;
      }
      // Сервер отклонил заказ: следующая попытка будет новым заказом.
      idempotencyKey.current = null;
      const code = body.error?.code;
      setFormError(code === "stock_changed" || code === "empty_cart" || code === "payment_unavailable" ? code : "generic");
      if (code === "stock_changed") retry();
    } catch {
      // Сетевая ошибка: ключ сохраняется, повторная отправка не создаст дубль.
      setFormError("network");
    } finally {
      setSubmitting(false);
    }
  }

  const errorText = (field: string) => {
    const key = errors[field];
    return key ? dict.checkout.errors[key] : undefined;
  };
  const hasFieldErrors = Object.keys(errors).length > 0;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8" aria-busy={submitting}>
        {(hasFieldErrors || formError) && (
          <div
            ref={errorSummaryRef}
            tabIndex={-1}
            role="alert"
            className="flex items-start gap-2 rounded-[var(--radius-field)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
          >
            <WarningCircleIcon size={18} weight="bold" aria-hidden className="mt-0.5 shrink-0" />
            <span>
              {formError ? dict.checkout.errors[formError] : dict.checkout.errorSummary}
              {formError === "stock_changed" && (
                <>
                  {" "}
                  <Link href={localePath(locale, "/cart")} className="underline">
                    {dict.checkout.backToCart}
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-display text-lg font-semibold">{dict.checkout.contact}</legend>
          <TextField
            id="name"
            name="name"
            label={dict.checkout.name}
            autoComplete="name"
            defaultValue={defaults?.name}
            required
            error={errorText("name")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              label={dict.checkout.phone}
              hint={dict.checkout.phoneHint}
              autoComplete="tel"
              defaultValue={defaults?.phone ?? "+998 "}
              required
              error={errorText("phone")}
            />
            <TextField
              id="email"
              name="email"
              type="email"
              label={dict.checkout.email}
              hint={dict.checkout.emailHint}
              autoComplete="email"
              defaultValue={defaults?.email ?? undefined}
              error={errorText("email")}
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-display text-lg font-semibold">{dict.checkout.delivery}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {deliveryMethods.map((method) => (
              <RadioCard
                key={method}
                name="deliveryMethod"
                value={method}
                checked={delivery === method}
                onChange={(value) => setDelivery(value as typeof method)}
              >
                {dict.checkout[method]}
              </RadioCard>
            ))}
          </div>
          {delivery === "courier" ? (
            <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
              <TextField
                id="city"
                name="city"
                label={dict.checkout.city}
                autoComplete="address-level2"
                defaultValue={defaults?.city ?? undefined}
                error={errorText("city")}
              />
              <TextField
                id="address"
                name="address"
                label={dict.checkout.address}
                hint={dict.checkout.addressHint}
                autoComplete="street-address"
                defaultValue={defaults?.address ?? undefined}
                error={errorText("address")}
              />
            </div>
          ) : (
            <p className="text-sm text-text-muted">{dict.checkout.pickupNote}</p>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-display text-lg font-semibold">{dict.checkout.payment}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {paymentMethods
              .filter((method) => onlinePayment || method !== "card_online")
              .map((method) => (
              <RadioCard
                key={method}
                name="paymentMethod"
                value={method}
                checked={payment === method}
                onChange={(value) => setPayment(value as typeof method)}
              >
                {dict.checkout[method]}
              </RadioCard>
            ))}
          </div>
          <p className="text-sm text-text-muted">
            {payment === "card_online" ? dict.checkout.cardOnlineNote : dict.checkout.paymentNote}
          </p>
        </fieldset>

        <TextAreaField
          id="comment"
          name="comment"
          label={dict.checkout.comment}
          hint={dict.checkout.commentHint}
          maxLength={500}
          error={errorText("comment")}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={submitting || blocked || status === "loading"}>
            {submitting ? dict.checkout.submitting : payment === "card_online" ? dict.checkout.submitPay : dict.checkout.submit}
          </Button>
          <Link href={localePath(locale, "/cart")} className={buttonStyles({ variant: "ghost" })}>
            {dict.checkout.backToCart}
          </Link>
        </div>
      </form>

      <div className="lg:sticky lg:top-28">
        <OrderSummary
          locale={locale}
          dict={dict}
          itemCount={quote.itemCount}
          subtotal={quote.subtotalUzs}
          usdRate={usdRate}
          pending={status === "loading"}
        >
          <ul className="flex flex-col gap-2 border-t border-border pt-4">
            {lines.map((line) => (
              <li key={line.productId} className="flex justify-between gap-3 text-sm">
                <span className="text-text-muted">
                  {line.name[locale]} × {line.quantity}
                </span>
                <span className="shrink-0 tabular-nums">{formatMoney(line.lineTotalUzs, locale)}</span>
              </li>
            ))}
          </ul>
        </OrderSummary>
      </div>
    </div>
  );
}
