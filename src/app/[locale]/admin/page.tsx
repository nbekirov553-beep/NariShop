import Link from "next/link";
import { Suspense } from "react";
import { OrdersTable } from "@/components/admin/orders-table";
import { AdminSection, EmptyState } from "@/components/admin/ui";
import { buttonStyles } from "@/components/ui/button";
import { orderStatuses } from "@/features/orders/schema";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { requirePageUser } from "@/server/policies";
import { countOrdersByStatus, listOrders } from "@/server/services/orders";

export default async function AdminDashboardPage() {
  const { locale, dict } = await getI18n();
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
      <Dashboard locale={locale} dict={dict} />
    </Suspense>
  );
}

async function Dashboard({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const user = await requirePageUser(locale, localePath(locale, "/admin"), "admin:access");
  const [counts, recent] = await Promise.all([countOrdersByStatus(user), listOrders(user, { limit: 5 })]);
  const ordersPath = localePath(locale, "/admin/orders");

  return (
    <div className="flex flex-col gap-8">
      <AdminSection title={dict.admin.dashboard.ordersByStatus}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {orderStatuses.map((status) => (
            <li key={status}>
              <Link
                href={`${ordersPath}?status=${status}`}
                className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-colors hover:border-text-muted"
              >
                <span className="font-display text-3xl font-semibold tabular-nums">{counts[status]}</span>
                <span className="text-sm text-text-muted">{dict.orderStatus[status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </AdminSection>
      <AdminSection
        title={dict.admin.dashboard.recent}
        actions={
          <Link href={ordersPath} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            {dict.admin.dashboard.allOrders}
          </Link>
        }
      >
        {recent.items.length ? (
          <OrdersTable orders={recent.items} locale={locale} dict={dict} />
        ) : (
          <EmptyState>{dict.admin.orders.empty}</EmptyState>
        )}
      </AdminSection>
    </div>
  );
}
