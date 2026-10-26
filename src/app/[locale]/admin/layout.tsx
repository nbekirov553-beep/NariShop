import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav, type AdminNavItem } from "@/components/admin/admin-nav";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { can, type Permission } from "@/server/permissions";
import { getCurrentUser } from "@/server/policies";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: { template: `%s · ${dict.admin.title}`, default: dict.admin.title }, robots: { index: false } };
}

export default async function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  const { locale, dict } = await getI18n();
  return (
    <div className="sheet flex flex-col gap-6">
      <h1 className="font-display text-[1.75rem] font-semibold tracking-tight sm:text-4xl">{dict.admin.title}</h1>
      <Suspense fallback={<div className="h-10" />}>
        <AdminNavSlot locale={locale} dict={dict} />
      </Suspense>
      {children}
    </div>
  );
}

async function AdminNavSlot({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const user = await getCurrentUser();
  const nav = dict.admin.nav;
  const items: Array<AdminNavItem & { permission: Permission }> = [
    { href: localePath(locale, "/admin"), label: nav.dashboard, exact: true, permission: "admin:access" },
    { href: localePath(locale, "/admin/orders"), label: nav.orders, permission: "orders:manage" },
    { href: localePath(locale, "/admin/products"), label: nav.products, permission: "catalog:manage" },
    { href: localePath(locale, "/admin/categories"), label: nav.categories, permission: "catalog:manage" },
    { href: localePath(locale, "/admin/audit"), label: nav.audit, permission: "audit:read" },
  ];
  const allowed = items
    .filter((item) => can(user, item.permission))
    .map(({ href, label, exact }) => ({ href, label, exact }));
  if (allowed.length === 0) return null;
  return <AdminNav items={allowed} label={dict.admin.title} />;
}
