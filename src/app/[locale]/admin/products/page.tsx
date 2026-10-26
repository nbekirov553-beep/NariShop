import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSection, EmptyState, firstParam, Pagination, tableStyles as s, withQuery } from "@/components/admin/ui";
import { Button, buttonStyles } from "@/components/ui/button";
import { inputStyles } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/money";
import { setProductActiveAction } from "@/server/admin-actions";
import { requirePageUser } from "@/server/policies";
import { adminListProducts } from "@/server/services/catalog-admin";

type Props = PageProps<"/[locale]/admin/products">;
const statuses = ["all", "active", "archived"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.admin.nav.products };
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const { locale, dict } = await getI18n();
  return (
    <AdminSection
      title={dict.admin.nav.products}
      actions={
        <Link href={localePath(locale, "/admin/products/new")} className={buttonStyles({ size: "sm" })}>
          <PlusIcon size={16} weight="bold" aria-hidden />
          {dict.admin.products.new}
        </Link>
      }
    >
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
        <ProductsList locale={locale} dict={dict} searchParams={searchParams} />
      </Suspense>
    </AdminSection>
  );
}

async function ProductsList({ locale, dict, searchParams }: { locale: Locale; dict: Dictionary; searchParams: Props["searchParams"] }) {
  const path = localePath(locale, "/admin/products");
  const user = await requirePageUser(locale, path, "catalog:manage");
  const params = await searchParams;
  const statusParam = firstParam(params.status);
  const status = statuses.find((value) => value === statusParam) ?? "all";
  const q = firstParam(params.q)?.slice(0, 80) ?? "";
  const page = Number(firstParam(params.page)) || 1;
  const result = await adminListProducts(user, { q, status, page });
  const p = dict.admin.products;

  return (
    <div className="flex flex-col gap-4">
      <form action={path} className="flex flex-wrap gap-2" role="search">
        <label htmlFor="products-q" className="sr-only">{p.search}</label>
        <input id="products-q" name="q" type="search" defaultValue={q} placeholder={p.search} className={cn(inputStyles, "h-11 min-w-0 flex-[2_1_14rem]")} />
        <label htmlFor="products-status" className="sr-only">{p.state}</label>
        <select id="products-status" name="status" defaultValue={status} className={cn(inputStyles, "h-11 min-w-0 flex-[1_1_9rem]")}>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {p[value]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">{dict.admin.search}</Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState>{p.empty}</EmptyState>
      ) : (
        <div className={s.wrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col" className={s.th}>{p.product}</th>
                <th scope="col" className={`${s.th} text-right`}>{p.price}</th>
                <th scope="col" className={`${s.th} text-right`}>{p.stock}</th>
                <th scope="col" className={s.th}>{p.state}</th>
                <th scope="col" className={s.th}><span className="sr-only">{dict.admin.edit}</span></th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((product) => (
                <tr key={product.id} className="last:[&>td]:border-b-0">
                  <td className={s.td}>
                    <div className="flex items-center gap-3">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-[var(--radius-field)] bg-surface-muted">
                        {product.imageUrl && (
                          <Image src={product.imageUrl} alt="" fill sizes="44px" className="object-contain p-1" />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <Link href={localePath(locale, `/admin/products/${product.id}`)} className={s.link}>
                          {product.name[locale]}
                        </Link>
                        <span className="text-[13px] text-text-muted">
                          {product.brand} · {product.sku}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className={`${s.td} whitespace-nowrap text-right tabular-nums`}>{formatMoney(product.priceUzs, locale)}</td>
                  <td className={`${s.td} text-right tabular-nums ${product.stockQuantity === 0 ? "text-danger" : ""}`}>
                    {product.stockQuantity}
                  </td>
                  <td className={s.td}>
                    <span className={product.isActive ? "text-success" : "text-text-muted"}>
                      {product.isActive ? p.active : p.archived}
                    </span>
                  </td>
                  <td className={`${s.td} text-right`}>
                    <form action={setProductActiveAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="active" value={String(!product.isActive)} />
                      <Button type="submit" variant="ghost" size="sm">
                        {product.isActive ? p.archive : p.restore}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        dict={dict}
        hrefFor={(next) => withQuery(path, { q, status: status === "all" ? undefined : status, page: next })}
      />
    </div>
  );
}
