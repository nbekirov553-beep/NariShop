import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryForm } from "@/components/admin/category-form";
import { AdminSection } from "@/components/admin/ui";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/dictionaries";
import { requirePageUser } from "@/server/policies";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.admin.categories.new };
}

export default async function NewCategoryPage() {
  const { locale, dict } = await getI18n();
  return (
    <AdminSection title={dict.admin.categories.new}>
      <Suspense fallback={<div className="h-[30rem] animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
        <NewCategory locale={locale} />
      </Suspense>
    </AdminSection>
  );
}

async function NewCategory({ locale }: { locale: Locale }) {
  await requirePageUser(locale, localePath(locale, "/admin/categories/new"), "catalog:manage");
  return <CategoryForm category={null} />;
}
