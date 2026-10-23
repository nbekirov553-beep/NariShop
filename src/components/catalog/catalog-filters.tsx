"use client";

import { FunnelIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition, type FormEvent } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { inputStyles } from "@/components/ui/field";
import { catalogHref, hasActiveFilters, type CatalogState } from "@/features/catalog/href";
import { sortOptions, type SortOption } from "@/features/catalog/query";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";
import { plural } from "@/lib/i18n/format";
import { cn } from "@/lib/cn";

interface FiltersProps {
  basePath: string;
  state: CatalogState;
  categories: Array<{ slug: string; name: string }>;
  activeCategory: string | null;
  brands: string[];
  priceBounds: { min: number; max: number } | null;
  total: number;
}

function useCatalogNavigation() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (href: string) =>
    startTransition(() => router.push(href, { scroll: false }));
  return { navigate, pending };
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function FiltersBody({
  basePath,
  state,
  categories,
  activeCategory,
  brands,
  priceBounds,
  onNavigate,
}: Omit<FiltersProps, "total"> & { onNavigate: (href: string) => void }) {
  const { locale, dict } = useI18n();
  const catalogBase = localePath(locale, "/catalog");
  const checkbox =
    "size-5 shrink-0 cursor-pointer rounded-[6px] border border-border accent-[var(--accent)]";

  function applyPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const toNumber = (value: FormDataEntryValue | null) => {
      const parsed = Number(String(value ?? "").replace(/\s/g, ""));
      return value && Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : undefined;
    };
    onNavigate(
      catalogHref(basePath, state, {
        minPrice: toNumber(data.get("minPrice")),
        maxPrice: toNumber(data.get("maxPrice")),
      }),
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FilterGroup title={dict.catalog.category}>
        <ul className="-mx-2 flex flex-col">
          {[{ slug: null, name: dict.catalog.allCategories }, ...categories].map((category) => {
            const active = category.slug === activeCategory;
            const base = category.slug ? `${catalogBase}/${category.slug}` : catalogBase;
            return (
              <li key={category.slug ?? "all"}>
                <Link
                  href={catalogHref(base, { sort: state.sort, page: 1, q: state.q })}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-9 items-center rounded-[var(--radius-field)] px-2 text-[15px] transition-colors",
                    active ? "bg-fill-hover font-semibold" : "text-vibrant hover:bg-fill hover:text-text",
                  )}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </FilterGroup>

      {brands.length > 0 && (
        <FilterGroup title={dict.catalog.brand}>
          {brands.map((brand) => {
            const checked = state.brand?.includes(brand) ?? false;
            return (
              <label key={brand} className="flex cursor-pointer items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  className={checkbox}
                  checked={checked}
                  onChange={() => {
                    const current = state.brand ?? [];
                    const next = checked
                      ? current.filter((item) => item !== brand)
                      : [...current, brand];
                    onNavigate(catalogHref(basePath, state, { brand: next }));
                  }}
                />
                {brand}
              </label>
            );
          })}
        </FilterGroup>
      )}

      <FilterGroup title={dict.catalog.price}>
        <form
          key={`${state.minPrice ?? ""}-${state.maxPrice ?? ""}`}
          onSubmit={applyPrice}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-[13px] text-text-muted">
              {dict.catalog.priceFrom}
              <input
                name="minPrice"
                inputMode="numeric"
                defaultValue={state.minPrice ?? ""}
                placeholder={priceBounds ? String(priceBounds.min) : undefined}
                className={cn(inputStyles, "h-10 px-3")}
              />
            </label>
            <label className="flex flex-col gap-1 text-[13px] text-text-muted">
              {dict.catalog.priceTo}
              <input
                name="maxPrice"
                inputMode="numeric"
                defaultValue={state.maxPrice ?? ""}
                placeholder={priceBounds ? String(priceBounds.max) : undefined}
                className={cn(inputStyles, "h-10 px-3")}
              />
            </label>
          </div>
          <Button type="submit" variant="secondary" size="sm">
            {dict.catalog.applyPrice}
          </Button>
        </form>
      </FilterGroup>

      <FilterGroup title={dict.product.inStock}>
        <label className="flex cursor-pointer items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            className={checkbox}
            checked={Boolean(state.inStock)}
            onChange={() =>
              onNavigate(catalogHref(basePath, state, { inStock: state.inStock ? undefined : true }))
            }
          />
          {dict.catalog.inStock}
        </label>
      </FilterGroup>

      {hasActiveFilters(state) && (
        <Link
          href={catalogHref(basePath, { q: state.q, sort: state.sort, page: 1 })}
          scroll={false}
          className={buttonStyles({ variant: "ghost", size: "sm", className: "self-start" })}
        >
          <XIcon size={16} aria-hidden />
          {dict.catalog.resetFilters}
        </Link>
      )}
    </div>
  );
}

export function CatalogSidebar(props: FiltersProps) {
  const { navigate, pending } = useCatalogNavigation();
  return (
    <div aria-busy={pending} className={cn("transition-opacity", pending && "opacity-60")}>
      <FiltersBody {...props} onNavigate={navigate} />
    </div>
  );
}

export function CatalogToolbar(props: FiltersProps) {
  const { locale, dict } = useI18n();
  const { navigate, pending } = useCatalogNavigation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeCount =
    (props.state.brand?.length ?? 0) +
    (props.state.minPrice !== undefined || props.state.maxPrice !== undefined ? 1 : 0) +
    (props.state.inStock ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonStyles({ variant: "secondary", size: "sm", className: "lg:hidden" })}
        aria-haspopup="dialog"
      >
        <FunnelIcon size={16} aria-hidden />
        {dict.catalog.filters}
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-[var(--radius-pill)] bg-accent text-[11px] font-bold text-accent-contrast">
            {activeCount}
          </span>
        )}
      </button>
      <p className="hidden text-sm text-text-muted lg:block" aria-live="polite">
        {plural(locale, props.total, dict.catalog.products)}
      </p>
      <label className="ml-auto flex items-center gap-2 text-sm text-text-muted">
        <span className="hidden sm:inline">{dict.catalog.sort}</span>
        <select
          value={props.state.sort}
          disabled={pending}
          onChange={(event) =>
            navigate(catalogHref(props.basePath, props.state, { sort: event.target.value as SortOption }))
          }
          className={cn(inputStyles, "h-9 w-auto cursor-pointer rounded-[var(--radius-pill)] pr-8 text-sm")}
          aria-label={dict.catalog.sort}
        >
          {sortOptions.map((option) => (
            <option key={option} value={option}>
              {dict.catalog.sortOptions[option]}
            </option>
          ))}
        </select>
      </label>

      <dialog
        ref={dialogRef}
        aria-label={dict.catalog.filters}
        className="drawer drawer-right m-0 ml-auto border-l h-dvh max-h-dvh w-[min(24rem,92vw)] max-w-none material material-thick border-material-edge p-0 text-text"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-material-edge px-4">
            <span className="font-display text-lg font-semibold">{dict.catalog.filters}</span>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={dict.nav.close}
              className="flex size-11 items-center justify-center rounded-[var(--radius-pill)] hover:bg-fill-hover"
            >
              <XIcon size={22} aria-hidden />
            </button>
          </div>
          <div aria-busy={pending} className={cn("flex-1 overflow-y-auto p-4", pending && "opacity-60")}>
            <FiltersBody {...props} onNavigate={navigate} />
          </div>
          <div className="border-t border-material-edge p-4">
            <Button full onClick={() => dialogRef.current?.close()}>
              {dict.catalog.showResults}: {plural(locale, props.total, dict.catalog.products)}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
