import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminSection } from "@/components/admin/ui";
import { buttonStyles } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { t } from "@/lib/i18n/format";
import { requirePageUser } from "@/server/policies";
import { adminListCategories, getProductForAdmin } from "@/server/services/catalog-admin";

type Props = PageProps<"/[locale]/admin/products/[id]">;

// Закрытая страница: путь и сессия известны только на запросе, мгновенная навигация не нужна.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.admin.nav.products };
}

export default async function EditProductPage({ params }: Props) {
  const { locale, dict } = await getI18n();
  return (
    <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
      <EditProduct locale={locale} dict={dict} params={params} />
    </Suspense>
  );
}

async function EditProduct({ locale, dict, params }: { locale: Locale; dict: Dictionary; params: Props["params"] }) {
  const { id } = await params;
  const user = await requirePageUser(locale, localePath(locale, `/admin/products/${id}`), "catalog:manage");
  const [product, categories] = await Promise.all([getProductForAdmin(user, id), adminListCategories(user)]);
  if (!product) notFound();

  return (
    <AdminSection
      title={t(dict.admin.products.editTitle, { sku: product.sku })}
      actions={
        product.isActive && (
          <Link href={localePath(locale, `/product/${product.slug}`)} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            {dict.admin.products.view}
            <ArrowSquareOutIcon size={16} aria-hidden />
          </Link>
        )
      }
    >
      <ProductForm key={id} product={product} categories={categories} />
    </AdminSection>
  );
}
