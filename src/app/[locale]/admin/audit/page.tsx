import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSection, EmptyState, firstParam, Pagination, tableStyles as s, withQuery } from "@/components/admin/ui";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { formatDateTime } from "@/lib/i18n/format";
import { requirePageUser } from "@/server/policies";
import { listAuditLog, type AuditEntry } from "@/server/services/audit";

type Props = PageProps<"/[locale]/admin/audit">;

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.admin.nav.audit };
}

export default async function AdminAuditPage({ searchParams }: Props) {
  const { locale, dict } = await getI18n();
  return (
    <AdminSection title={dict.admin.nav.audit}>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
        <AuditList locale={locale} dict={dict} searchParams={searchParams} />
      </Suspense>
    </AdminSection>
  );
}

function entityHref(entry: AuditEntry, locale: Locale): string | null {
  if (entry.entityType === "order") return localePath(locale, `/admin/orders/${entry.entityId}`);
  if (entry.entityType === "product") return localePath(locale, `/admin/products/${entry.entityId}`);
  if (entry.entityType === "category") return localePath(locale, `/admin/categories/${entry.entityId}`);
  return null;
}

function describe(entry: AuditEntry, dict: Dictionary): string {
  const { from, to, changed } = entry.metadata as { from?: string; to?: string; changed?: string[] };
  if (entry.action === "order.status_changed" && from && to) {
    return `${dict.orderStatus[from as keyof Dictionary["orderStatus"]] ?? from} → ${dict.orderStatus[to as keyof Dictionary["orderStatus"]] ?? to}`;
  }
  if (entry.action === "order.payment_changed" && from && to) {
    return `${dict.paymentStatus[from as keyof Dictionary["paymentStatus"]] ?? from} → ${dict.paymentStatus[to as keyof Dictionary["paymentStatus"]] ?? to}`;
  }
  if (changed?.length) {
    const fields = dict.admin.fields;
    return changed.map((key) => fields[key as keyof typeof fields] ?? key).join(", ");
  }
  return "";
}

async function AuditList({ locale, dict, searchParams }: { locale: Locale; dict: Dictionary; searchParams: Props["searchParams"] }) {
  const path = localePath(locale, "/admin/audit");
  const user = await requirePageUser(locale, path, "audit:read");
  const params = await searchParams;
  const result = await listAuditLog(user, { page: Number(firstParam(params.page)) || 1 });
  const a = dict.admin.audit;

  if (result.items.length === 0) return <EmptyState>{a.empty}</EmptyState>;

  return (
    <div className="flex flex-col gap-4">
      <div className={s.wrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col" className={s.th}>{a.when}</th>
              <th scope="col" className={s.th}>{a.actor}</th>
              <th scope="col" className={s.th}>{a.action}</th>
              <th scope="col" className={s.th}>{a.entity}</th>
              <th scope="col" className={s.th}>{a.details}</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((entry) => {
              const href = entityHref(entry, locale);
              return (
                <tr key={entry.id} className="last:[&>td]:border-b-0">
                  <td className={`${s.td} whitespace-nowrap text-text-muted`}>{formatDateTime(entry.createdAt, locale)}</td>
                  <td className={s.td}>{entry.actor ? (entry.actor.name ?? entry.actor.email) : a.system}</td>
                  <td className={s.td}>{a.actions[entry.action as keyof typeof a.actions] ?? entry.action}</td>
                  <td className={s.td}>
                    {href ? (
                      <Link href={href} className={s.link}>
                        {entry.entityId}
                      </Link>
                    ) : (
                      entry.entityId
                    )}
                  </td>
                  <td className={`${s.td} text-text-muted`}>{describe(entry, dict)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={result.page} pageCount={result.pageCount} dict={dict} hrefFor={(next) => withQuery(path, { page: next })} />
    </div>
  );
}
