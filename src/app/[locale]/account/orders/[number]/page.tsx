import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderLines } from "@/components/orders/order-lines";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badge";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { formatDateTime, t } from "@/lib/i18n/format";
import { requirePageUser } from "@/server/policies";
import { getOrderForUser } from "@/server/services/orders";

// Закрытая страница: путь и сессия известны только на запросе, мгновенная навигация не нужна.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/account/orders/[number]">): Promise<Metadata> {
  const [{ dict }, { number }] = await Promise.all([getI18n(), params]);
  return { title: t(dict.account.order, { number }), robots: { index: false } };
}

export default async function AccountOrderPage({ params }: PageProps<"/[locale]/account/orders/[number]">) {
  const { locale, dict } = await getI18n();
  return (
    <div className="sheet flex flex-col gap-6">
      <Link
        href={localePath(locale, "/account")}
        className="flex w-fit items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeftIcon size={16} aria-hidden />
        {dict.account.backToOrders}
      </Link>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
        <OrderContent locale={locale} dict={dict} params={params} />
      </Suspense>
    </div>
  );
}

async function OrderContent({
  locale,
  dict,
  params,
}: {
  locale: Locale;
  dict: Dictionary;
  params: PageProps<"/[locale]/account/orders/[number]">["params"];
}) {
  const { number } = await params;
  const user = await requirePageUser(locale, localePath(locale, `/account/orders/${number}`));
  const order = await getOrderForUser(number, user.id);
  if (!order) notFound();
  const checkoutDict = dict.checkout;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
      <section className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-border bg-surface p-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{t(dict.account.order, { number })}</h1>
          <p className="text-sm text-text-muted">{t(dict.account.placedAt, { date: formatDateTime(order.createdAt, locale) })}</p>
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} dict={dict} />
            <PaymentStatusBadge status={order.paymentStatus} dict={dict} />
          </div>
        </div>
        <h2 className="text-[15px] font-semibold">{dict.account.items}</h2>
        <OrderLines order={order} locale={locale} dict={dict} />
      </section>
      <aside className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-6 text-[15px]">
        <p>
          <span className="block text-[13px] text-text-muted">{checkoutDict.delivery}</span>
          {checkoutDict[order.deliveryMethod]}
        </p>
        {order.checkout.deliveryMethod === "courier" && (
          <p>
            <span className="block text-[13px] text-text-muted">{checkoutDict.address}</span>
            {order.checkout.city}, {order.checkout.address}
          </p>
        )}
        <p>
          <span className="block text-[13px] text-text-muted">{checkoutDict.payment}</span>
          {checkoutDict[order.paymentMethod]}
        </p>
        <p>
          <span className="block text-[13px] text-text-muted">{checkoutDict.phone}</span>
          {order.checkout.phone}
        </p>
      </aside>
    </div>
  );
}
