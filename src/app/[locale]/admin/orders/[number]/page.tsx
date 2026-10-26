import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderActions } from "@/components/admin/order-actions";
import { OrderLines } from "@/components/orders/order-lines";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badge";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { formatDateTime, t } from "@/lib/i18n/format";
import { formatUsd, formatUsdRate, uzsToUsd } from "@/lib/money";
import { getUsdRate } from "@/server/fx";
import { manualPaymentTransitions } from "@/server/payments";
import { requirePageUser } from "@/server/policies";
import { getOrderByNumber } from "@/server/services/orders";

type Props = PageProps<"/[locale]/admin/orders/[number]">;

// Закрытая страница: путь и сессия известны только на запросе, мгновенная навигация не нужна.
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ dict }, { number }] = await Promise.all([getI18n(), params]);
  return { title: t(dict.account.order, { number }) };
}

export default async function AdminOrderPage({ params }: Props) {
  const { locale, dict } = await getI18n();
  return (
    <div className="flex flex-col gap-4">
      <Link
        href={localePath(locale, "/admin/orders")}
        className="flex w-fit items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeftIcon size={16} aria-hidden />
        {dict.admin.nav.orders}
      </Link>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
        <OrderView locale={locale} dict={dict} params={params} />
      </Suspense>
    </div>
  );
}

async function OrderView({ locale, dict, params }: { locale: Locale; dict: Dictionary; params: Props["params"] }) {
  const { number } = await params;
  const user = await requirePageUser(locale, localePath(locale, `/admin/orders/${number}`), "orders:manage");
  const order = await getOrderByNumber(user, number);
  if (!order) notFound();
  const o = dict.admin.orders;
  const c = dict.checkout;
  const usdRate = getUsdRate();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
      <section className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-2xl font-semibold">{t(dict.account.order, { number })}</h2>
          <p className="text-sm text-text-muted">{t(dict.account.placedAt, { date: formatDateTime(order.createdAt, locale) })}</p>
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} dict={dict} />
            <PaymentStatusBadge status={order.paymentStatus} dict={dict} />
          </div>
        </div>
        <OrderLines order={order} locale={locale} dict={dict} />
      </section>
      <div className="flex flex-col gap-4">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
          <OrderActions
            number={order.orderNumber}
            status={order.status}
            paymentStatus={order.paymentStatus}
            paymentTargets={manualPaymentTransitions[order.paymentStatus]}
          />
        </section>
        <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5 text-[15px] sm:p-6">
          <h3 className="font-semibold">{o.contact}</h3>
          <p>
            {order.checkout.name}
            <br />
            <a href={`tel:${order.checkout.phone}`} className="underline-offset-4 hover:underline">
              {order.checkout.phone}
            </a>
            {order.checkout.email && (
              <>
                <br />
                <a href={`mailto:${order.checkout.email}`} className="underline-offset-4 hover:underline">
                  {order.checkout.email}
                </a>
              </>
            )}
          </p>
          <p>
            <span className="block text-[13px] text-text-muted">{o.delivery}</span>
            {c[order.deliveryMethod]}
            {order.checkout.deliveryMethod === "courier" && (
              <>
                <br />
                {order.checkout.city}, {order.checkout.address}
              </>
            )}
          </p>
          <p>
            <span className="block text-[13px] text-text-muted">{o.paymentMethod}</span>
            {c[order.paymentMethod]}
          </p>
          {usdRate && (
            <p>
              <span className="block text-[13px] text-text-muted">{o.usdTitle}</span>
              <span className="tabular-nums">
                {t(o.usdApprox, {
                  usd: formatUsd(uzsToUsd(order.totalUzs, usdRate), locale),
                  rate: formatUsdRate(usdRate, locale),
                })}
              </span>
            </p>
          )}
          {order.checkout.comment && (
            <p>
              <span className="block text-[13px] text-text-muted">{o.comment}</span>
              {order.checkout.comment}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
