import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSection, tableStyles as s } from "@/components/admin/ui";
import { buttonStyles } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { requirePageUser } from "@/server/policies";
import { adminListCategories } from "@/server/services/catalog-admin";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.admin.nav.categories };
}

export default async function AdminCategoriesPage() {
  const { locale, dict } = await getI18n();
  return (
    <AdminSection
      title={dict.admin.nav.categories}
      actions={
        <Link href={localePath(locale, "/admin/categories/new")} className={buttonStyles({ size: "sm" })}>
          <PlusIcon size={16} weight="bold" aria-hidden />
          {dict.admin.categories.new}
        </Link>
      }
    >
      <Suspense fallback={<div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
        <CategoriesList locale={locale} dict={dict} />
      </Suspense>
    </AdminSection>
  );
}

async function CategoriesList({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const user = await requirePageUser(locale, localePath(locale, "/admin/categories"), "catalog:manage");
  const categories = await adminListCategories(user);
  const c = dict.admin.categories;

  return (
    <div className={s.wrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col" className={s.th}>{dict.admin.fields.name}</th>
            <th scope="col" className={s.th}>{dict.admin.fields.slug}</th>
            <th scope="col" className={`${s.th} text-right`}>{c.products}</th>
            <th scope="col" className={`${s.th} text-right`}>{c.order}</th>
            <th scope="col" className={s.th}>{dict.admin.products.state}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="last:[&>td]:border-b-0">
              <td className={s.td}>
                <Link href={localePath(locale, `/admin/categories/${category.id}`)} className={s.link}>
                  {category.name[locale]}
                </Link>
              </td>
              <td className={`${s.td} text-text-muted`}>{category.slug}</td>
              <td className={`${s.td} text-right tabular-nums`}>{category.productCount}</td>
              <td className={`${s.td} text-right tabular-nums`}>{category.sortOrder}</td>
              <td className={s.td}>
                <span className={category.isActive ? "text-success" : "text-text-muted"}>
                  {category.isActive ? c.visible : c.hidden}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
