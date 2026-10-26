import { CaretRightIcon, PackageIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AvatarEditor } from "@/components/account/avatar-editor";
import { ProfileForm } from "@/components/account/profile-form";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { buttonStyles } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { formatDateTime, plural } from "@/lib/i18n/format";
import { formatMoney } from "@/lib/money";
import { requirePageUser } from "@/server/policies";
import { listOrdersForUser } from "@/server/services/orders";
import { getOwnProfile } from "@/server/services/users";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.account.title, robots: { index: false } };
}

export default async function AccountPage() {
  const { locale, dict } = await getI18n();
  return (
    <div className="sheet flex flex-col gap-8">
      <h1 className="font-display text-[1.75rem] font-semibold tracking-tight sm:text-4xl">{dict.account.title}</h1>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
        <AccountContent locale={locale} dict={dict} />
      </Suspense>
    </div>
  );
}

async function AccountContent({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const user = await requirePageUser(locale, localePath(locale, "/account"));
  const [profile, orders] = await Promise.all([getOwnProfile(user.id), listOrdersForUser(user.id)]);
  if (!profile) notFound();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:items-start">
      <section aria-labelledby="profile-title" className="flex flex-col gap-6 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
        <h2 id="profile-title" className="font-display text-xl font-semibold">
          {dict.account.profile}
        </h2>
        <AvatarEditor user={{ name: user.name, email: user.email, image: profile.image }} />
        <ProfileForm profile={profile} today={today} />
      </section>

      <section aria-labelledby="orders-title" className="flex flex-col gap-4">
        <h2 id="orders-title" className="font-display text-xl font-semibold">
          {dict.account.orders}
        </h2>
        {orders.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6">
            <PackageIcon size={40} weight="duotone" aria-hidden className="text-text-muted" />
            <p className="text-[15px] font-medium">{dict.account.ordersEmpty}</p>
            <p className="text-sm text-text-muted">{dict.account.ordersGuestNote}</p>
            <Link href={localePath(locale, "/catalog")} className={buttonStyles()}>
              {dict.account.toCatalog}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.orderNumber}>
                <Link
                  href={localePath(locale, `/account/orders/${order.orderNumber}`)}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-colors hover:border-text-muted sm:p-5"
                >
                  <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="whitespace-nowrap font-semibold">{order.orderNumber}</span>
                      <OrderStatusBadge status={order.status} dict={dict} />
                    </span>
                    <span className="text-[13px] text-text-muted">
                      {formatDateTime(order.createdAt, locale)} · {plural(locale, order.itemCount, dict.account.itemCount)}
                    </span>
                  </div>
                  <span className="ml-auto flex items-center gap-3">
                    <span className="whitespace-nowrap font-semibold tabular-nums">{formatMoney(order.totalUzs, locale)}</span>
                    <CaretRightIcon size={18} aria-hidden className="shrink-0 text-text-muted" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
