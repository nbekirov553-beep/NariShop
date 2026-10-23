import type { CatalogQuery } from "./query";

export type CatalogState = Pick<
  CatalogQuery,
  "q" | "brand" | "minPrice" | "maxPrice" | "inStock" | "sort" | "page"
>;

export function catalogHref(
  basePath: string,
  state: CatalogState,
  patch: Partial<CatalogState> = {},
): string {
  // Любое изменение фильтров возвращает на первую страницу.
  const next = { ...state, page: 1, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.brand?.length) params.set("brand", next.brand.join(","));
  if (next.minPrice !== undefined) params.set("minPrice", String(next.minPrice));
  if (next.maxPrice !== undefined) params.set("maxPrice", String(next.maxPrice));
  if (next.inStock) params.set("inStock", "1");
  if (next.sort && next.sort !== "popular") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}

export function hasActiveFilters(state: CatalogState): boolean {
  return Boolean(
    state.brand?.length ||
      state.minPrice !== undefined ||
      state.maxPrice !== undefined ||
      state.inStock,
  );
}
