import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryForm } from "@/components/admin/category-form";
import { AdminSection } from "@/components/admin/ui";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { t } from "@/lib/i18n/format";
import { requirePageUser } from "@/server/policies";
import { getCategoryForAdmin } from "@/server/services/catalog-admin";

type Props = PageProps<"/[locale]/admin/categories/[id]">;

// Закрытая страница: путь и сессия известны только на запросе, мгновенная навигация не нужна.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.admin.nav.categories };
}

export default async function EditCategoryPage({ params }: Props) {
  const { locale, dict } = await getI18n();
  return (
    <Suspense fallback={<div className="h-[30rem] animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
      <EditCategory locale={locale} dict={dict} params={params} />
    </Suspense>
  );
}

async function EditCategory({ locale, dict, params }: { locale: Locale; dict: Dictionary; params: Props["params"] }) {
  const { id } = await params;
  const user = await requirePageUser(locale, localePath(locale, `/admin/categories/${id}`), "catalog:manage");
  const category = await getCategoryForAdmin(user, id);
  if (!category) notFound();
  return (
    <AdminSection title={t(dict.admin.categories.editTitle, { name: category.name[locale] })}>
      <CategoryForm key={id} category={category} />
    </AdminSection>
  );
}
