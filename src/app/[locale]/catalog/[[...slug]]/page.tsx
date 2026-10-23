import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { CatalogSidebar, CatalogToolbar } from "@/components/catalog/catalog-filters";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { ProductGridSkeleton } from "@/components/catalog/product-grid-skeleton";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonStyles } from "@/components/ui/button";
import type { CatalogState } from "@/features/catalog/href";
import { parseCatalogQueryLenient } from "@/features/catalog/query";
import { localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/dictionaries";
import { plural, t } from "@/lib/i18n/format";
import { getCategoryBySlug, listCategories, listProducts } from "@/server/repositories/catalog";

type Props = PageProps<"/[locale]/catalog/[[...slug]]">;

export async function generateStaticParams() {
  const categories = await listCategories();
  return [{ slug: [] }, ...categories.map((category) => ({ slug: [category.slug] }))];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await getI18n();
  const category = slug?.[0] ? await getCategoryBySlug(slug[0]) : null;
  return {
    title: category ? category.name[locale] : dict.catalog.title,
    description: category ? category.description[locale] : dict.meta.description,
  };
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { dict } = await getI18n();
  return (
    <div className="sheet">
      <Suspense
        fallback={
          <ViewTransition exit="fade-out" default="none">
            <div className="flex flex-col gap-6">
              <div className="skeleton h-10 w-56 rounded-full" />
              <span className="sr-only">{dict.catalog.title}</span>
              <ProductGridSkeleton />
            </div>
          </ViewTransition>
        }
      >
        <ViewTransition enter="slide-up" default="none">
          <CatalogContent params={params} searchParams={searchParams} />
        </ViewTransition>
      </Suspense>
    </div>
  );
}

async function CatalogContent({ params, searchParams }: Props) {
  const [{ slug }, rawSearch, { locale, dict }, categories] = await Promise.all([
    params,
    searchParams,
    getI18n(),
    listCategories(),
  ]);

  if (slug && slug.length > 1) notFound();
  const category = slug?.[0] ? await getCategoryBySlug(slug[0]) : null;
  if (slug?.[0] && !category) notFound();

  const query = parseCatalogQueryLenient({ ...rawSearch, category: category?.slug });
  const result = await listProducts(query);

  const catalogBase = localePath(locale, "/catalog");
  const basePath = category ? `${catalogBase}/${category.slug}` : catalogBase;
  const state: CatalogState = {
    q: query.q,
    brand: query.brand,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    inStock: query.inStock,
    sort: query.sort,
    page: result.page,
  };

  const title = query.q
    ? t(dict.catalog.searchTitle, { q: query.q })
    : (category?.name[locale] ?? dict.catalog.title);

  const filterProps = {
    basePath,
    state,
    categories: categories.map((item) => ({ slug: item.slug, name: item.name[locale] })),
    activeCategory: category?.slug ?? null,
    brands: result.brands,
    priceBounds: result.priceBounds,
    total: result.total,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Breadcrumbs
          label={dict.nav.catalog}
          items={[
            { name: dict.nav.home, href: localePath(locale) },
            category
              ? { name: dict.catalog.title, href: catalogBase }
              : { name: dict.catalog.title },
            ...(category ? [{ name: category.name[locale] }] : []),
          ]}
        />
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl">
            {title}
          </h1>
          <span className="text-sm text-text-muted lg:hidden">
            {plural(locale, result.total, dict.catalog.products)}
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside aria-label={dict.catalog.filters} className="hidden lg:block">
          <div className="sticky top-28">
            <CatalogSidebar {...filterProps} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-col gap-5">
          <CatalogToolbar {...filterProps} />
          {result.items.length > 0 ? (
            <>
              <ProductGrid products={result.items} locale={locale} dict={dict} columns="narrow" morph eagerCount={3} />
              <Pagination
                basePath={basePath}
                state={state}
                page={result.page}
                pageCount={result.pageCount}
                labels={dict.catalog}
              />
            </>
          ) : (
            <div className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-8 sm:p-12">
              <MagnifyingGlassIcon size={40} weight="duotone" aria-hidden className="text-text-muted" />
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-semibold">{dict.catalog.emptyTitle}</h2>
                <p className="max-w-[50ch] text-[15px] text-text-muted">{dict.catalog.emptyText}</p>
              </div>
              <Link href={catalogBase} className={buttonStyles({ variant: "secondary" })}>
                {dict.catalog.resetFilters}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
