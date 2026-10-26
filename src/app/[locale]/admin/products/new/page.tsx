import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminSection } from "@/components/admin/ui";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/dictionaries";
import { requirePageUser } from "@/server/policies";
import { adminListCategories } from "@/server/services/catalog-admin";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.admin.products.new };
}

export default async function NewProductPage() {
  const { locale, dict } = await getI18n();
  return (
    <AdminSection title={dict.admin.products.new}>
      <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
        <NewProduct locale={locale} />
      </Suspense>
    </AdminSection>
  );
}

async function NewProduct({ locale }: { locale: Locale }) {
  const user = await requirePageUser(locale, localePath(locale, "/admin/products/new"), "catalog:manage");
  const categories = await adminListCategories(user);
  return <ProductForm product={null} categories={categories} />;
}
