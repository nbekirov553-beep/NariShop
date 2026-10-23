import type { CatalogQuery } from "@/features/catalog/query";
import { locales } from "@/lib/i18n/config";
import {
  demoCategories,
  demoProducts,
  type DemoCategory,
  type DemoProduct,
} from "@/server/demo/catalog-data";

// Доступ к каталогу. Сейчас читает demo-данные; при подключении Neon меняется только этот файл.

export type Category = DemoCategory;
export type Product = DemoProduct;

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
  brands: string[];
  priceBounds: { min: number; max: number } | null;
}

const activeProducts = () => demoProducts.filter((product) => product.isActive);

export async function listCategories(): Promise<Category[]> {
  return demoCategories
    .filter((category) => category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return demoCategories.find((category) => category.slug === slug && category.isActive) ?? null;
}

function searchHaystack(product: Product): string {
  const categoryNames = demoCategories
    .filter((category) => product.categoryIds.includes(category.id))
    .flatMap((category) => locales.map((locale) => category.name[locale]));
  return [
    product.brand,
    product.sku,
    ...locales.map((locale) => product.name[locale]),
    ...categoryNames,
  ]
    .join(" ")
    .toLowerCase();
}

function matchesSearch(product: Product, q: string): boolean {
  const haystack = searchHaystack(product);
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

const sorters: Record<CatalogQuery["sort"], (a: Product, b: Product) => number> = {
  popular: (a, b) => b.popularity - a.popularity,
  "price-asc": (a, b) => a.priceUzs - b.priceUzs,
  "price-desc": (a, b) => b.priceUzs - a.priceUzs,
  new: (a, b) => b.createdAt.localeCompare(a.createdAt),
};

export async function listProducts(query: CatalogQuery): Promise<ProductListResult> {
  const category = query.category ? await getCategoryBySlug(query.category) : null;
  if (query.category && !category) {
    return { items: [], total: 0, page: 1, pageCount: 0, brands: [], priceBounds: null };
  }

  // Фасеты считаются по категории и поиску, чтобы выбранный бренд не скрывал остальные.
  const scoped = activeProducts().filter(
    (product) =>
      (!category || product.categoryIds.includes(category.id)) &&
      (!query.q || matchesSearch(product, query.q)),
  );

  const brands = [...new Set(scoped.map((product) => product.brand))].sort();
  const prices = scoped.map((product) => product.priceUzs);
  const priceBounds = prices.length
    ? { min: Math.min(...prices), max: Math.max(...prices) }
    : null;

  const filtered = scoped
    .filter((product) => !query.brand?.length || query.brand.includes(product.brand))
    .filter((product) => query.minPrice === undefined || product.priceUzs >= query.minPrice)
    .filter((product) => query.maxPrice === undefined || product.priceUzs <= query.maxPrice)
    .filter((product) => !query.inStock || product.stockQuantity > 0)
    .sort(sorters[query.sort]);

  const pageCount = Math.ceil(filtered.length / query.limit);
  const page = Math.min(query.page, Math.max(pageCount, 1));
  const start = (page - 1) * query.limit;

  return {
    items: filtered.slice(start, start + query.limit),
    total: filtered.length,
    page,
    pageCount,
    brands,
    priceBounds,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return activeProducts().find((product) => product.slug === slug) ?? null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const wanted = new Set(ids);
  return activeProducts().filter((product) => wanted.has(product.id));
}

export async function getSimilarProducts(product: Product, limit = 4): Promise<Product[]> {
  return activeProducts()
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.categoryIds.some((id) => product.categoryIds.includes(id)),
    )
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

export async function getDealProducts(limit = 8): Promise<Product[]> {
  return activeProducts()
    .filter((product) => product.compareAtPriceUzs && product.compareAtPriceUzs > product.priceUzs)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

export async function getPopularProducts(limit = 8): Promise<Product[]> {
  return activeProducts()
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

export async function listAllProductSlugs(): Promise<string[]> {
  return activeProducts().map((product) => product.slug);
}

export async function countProductsByCategory(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const product of activeProducts()) {
    for (const id of product.categoryIds) counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
