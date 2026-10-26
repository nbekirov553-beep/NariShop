import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersTable } from "@/components/admin/orders-table";
import { AdminSection, EmptyState, firstParam, Pagination, withQuery } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { inputStyles } from "@/components/ui/field";
import { orderStatuses, type OrderStatus } from "@/features/orders/schema";
import { cn } from "@/lib/cn";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { requirePageUser } from "@/server/policies";
import { listOrders } from "@/server/services/orders";

type Props = PageProps<"/[locale]/admin/orders">;

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.admin.nav.orders };
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { locale, dict } = await getI18n();
  return (
    <AdminSection title={dict.admin.nav.orders}>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
        <OrdersList locale={locale} dict={dict} searchParams={searchParams} />
      </Suspense>
    </AdminSection>
  );
}

async function OrdersList({ locale, dict, searchParams }: { locale: Locale; dict: Dictionary; searchParams: Props["searchParams"] }) {
  const path = localePath(locale, "/admin/orders");
  const user = await requirePageUser(locale, path, "orders:manage");
  const params = await searchParams;
  const statusParam = firstParam(params.status);
  const status = orderStatuses.includes(statusParam as OrderStatus) ? (statusParam as OrderStatus) : undefined;
  const q = firstParam(params.q)?.trim().slice(0, 80) ?? "";
  const page = Number(firstParam(params.page)) || 1;
  const result = await listOrders(user, { status, q: q || undefined, page });
  const o = dict.admin.orders;

  return (
    <div className="flex flex-col gap-4">
      <form action={path} className="flex flex-wrap gap-2" role="search">
        <label htmlFor="orders-q" className="sr-only">{o.search}</label>
        <input id="orders-q" name="q" type="search" defaultValue={q} placeholder={o.search} className={cn(inputStyles, "h-11 min-w-0 flex-[2_1_14rem]")} />
        <label htmlFor="orders-status" className="sr-only">{o.status}</label>
        <select id="orders-status" name="status" defaultValue={status ?? ""} className={cn(inputStyles, "h-11 min-w-0 flex-[1_1_10rem]")}>
          <option value="">{o.allStatuses}</option>
          {orderStatuses.map((value) => (
            <option key={value} value={value}>
              {dict.orderStatus[value]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">{dict.admin.search}</Button>
      </form>
      {result.items.length ? (
        <OrdersTable orders={result.items} locale={locale} dict={dict} />
      ) : (
        <EmptyState>{o.empty}</EmptyState>
      )}
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        dict={dict}
        hrefFor={(next) => withQuery(path, { q, status, page: next })}
      />
    </div>
  );
}
