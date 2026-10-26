import { and, asc, desc, eq, gt, gte, inArray, isNotNull, lte, ne, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { CatalogQuery } from "@/features/catalog/query";
import type { Localized } from "@/lib/i18n/config";
import { getDb } from "@/server/db/client";
import { categories, productCategories, productImages, products } from "@/server/db/schema";
import type { CategoryIcon, DemoCategory, DemoProduct } from "@/server/demo/catalog-data";

// Доступ к каталогу в БД. Публичные чтения кэшируются ("use cache") с тегом CATALOG_TAG:
// после изменения каталога (админка) достаточно вызвать revalidateTag(CATALOG_TAG).

export const CATALOG_TAG = "catalog";

export type Category = DemoCategory;

export interface ProductCategoryRef {
  id: string;
  slug: string;
  name: Localized;
  icon: CategoryIcon;
}

export interface Product extends DemoProduct {
  /** Основная категория товара (первая по порядку). */
  category: ProductCategoryRef | null;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
  brands: string[];
  priceBounds: { min: number; max: number } | null;
}

type CategoryRow = typeof categories.$inferSelect;
type ProductRow = typeof products.$inferSelect;

function cacheCatalog() {
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    parentId: row.parentId,
    name: row.name,
    description: row.description,
    icon: row.icon,
    image: row.imageUrl,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

async function hydrate(rows: ProductRow[]): Promise<Product[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
  const ids = rows.map((row) => row.id);

  const [imageRows, linkRows] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.sortOrder), asc(productImages.id)),
    db
      .select({ productId: productCategories.productId, category: categories })
      .from(productCategories)
      .innerJoin(categories, eq(categories.id, productCategories.categoryId))
      .where(inArray(productCategories.productId, ids))
      .orderBy(asc(productCategories.sortOrder)),
  ]);

  return rows.map((row) => {
    const links = linkRows.filter((link) => link.productId === row.id);
    const primary = links[0]?.category;
    return {
      id: row.id,
      sku: row.sku,
      slug: row.slug,
      brand: row.brand,
      name: row.name,
      description: row.description,
      priceUzs: row.priceUzs,
      compareAtPriceUzs: row.compareAtPriceUzs,
      stockQuantity: row.stockQuantity,
      isActive: row.isActive,
      warrantyMonths: row.warrantyMonths,
      specifications: row.specifications,
      popularity: row.popularity,
      createdAt: row.createdAt.toISOString(),
      categoryIds: links.map((link) => link.category.id),
      category: primary
        ? { id: primary.id, slug: primary.slug, name: primary.name, icon: primary.icon }
        : null,
      images: imageRows
        .filter((image) => image.productId === row.id)
        .map((image) => ({ url: image.url, alt: image.alt, isPrimary: image.isPrimary })),
    };
  });
}

const isActive = eq(products.isActive, true);

function inCategory(categoryId: string): SQL {
  return sql`exists (select 1 from ${productCategories} where ${productCategories.productId} = ${products.id} and ${productCategories.categoryId} = ${categoryId})`;
}

function matchesSearch(q: string): SQL[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => sql`${products.searchText} like ${`%${token.replace(/[\\%_]/g, "\\$&")}%`}`);
}

const orderings: Record<CatalogQuery["sort"], SQL[]> = {
  popular: [desc(products.popularity), asc(products.id)],
  "price-asc": [asc(products.priceUzs), asc(products.id)],
  "price-desc": [desc(products.priceUzs), asc(products.id)],
  new: [desc(products.createdAt), asc(products.id)],
};

export async function listCategories(): Promise<Category[]> {
  "use cache";
  cacheCatalog();
  const db = await getDb();
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));
  return rows.map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  "use cache";
  cacheCatalog();
  const db = await getDb();
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1);
  return row ? toCategory(row) : null;
}

export async function listProducts(query: CatalogQuery): Promise<ProductListResult> {
  "use cache";
  cacheCatalog();
  const category = query.category ? await getCategoryBySlug(query.category) : null;
  if (query.category && !category) {
    return { items: [], total: 0, page: 1, pageCount: 0, brands: [], priceBounds: null };
  }

  const db = await getDb();

  // Фасеты считаются по категории и поиску, чтобы выбранный бренд не скрывал остальные.
  const scoped = and(isActive, ...(category ? [inCategory(category.id)] : []), ...matchesSearch(query.q ?? ""));
  const filtered = and(
    scoped,
    ...(query.brand?.length ? [inArray(products.brand, query.brand)] : []),
    ...(query.minPrice !== undefined ? [gte(products.priceUzs, query.minPrice)] : []),
    ...(query.maxPrice !== undefined ? [lte(products.priceUzs, query.maxPrice)] : []),
    ...(query.inStock ? [gt(products.stockQuantity, 0)] : []),
  );

  const [brandRows, [bounds], total] = await Promise.all([
    db.selectDistinct({ brand: products.brand }).from(products).where(scoped).orderBy(asc(products.brand)),
    db
      .select({
        min: sql<number | null>`min(${products.priceUzs})::int`,
        max: sql<number | null>`max(${products.priceUzs})::int`,
      })
      .from(products)
      .where(scoped),
    db.$count(products, filtered),
  ]);

  const pageCount = Math.ceil(total / query.limit);
  const page = Math.min(query.page, Math.max(pageCount, 1));
  const rows = await db
    .select()
    .from(products)
    .where(filtered)
    .orderBy(...orderings[query.sort])
    .limit(query.limit)
    .offset((page - 1) * query.limit);

  return {
    items: await hydrate(rows),
    total,
    page,
    pageCount,
    brands: brandRows.map((row) => row.brand),
    priceBounds: bounds && bounds.min !== null && bounds.max !== null ? { min: bounds.min, max: bounds.max } : null,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheCatalog();
  const db = await getDb();
  const rows = await db
    .select()
    .from(products)
    .where(and(isActive, eq(products.slug, slug)))
    .limit(1);
  const [product] = await hydrate(rows);
  return product ?? null;
}

/** Без кэша: корзина и заказ должны видеть актуальные цену и остаток. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const rows = await db
    .select()
    .from(products)
    .where(and(isActive, inArray(products.id, ids)));
  return hydrate(rows);
}

async function similarProducts(productId: string, categoryIds: string[], limit: number): Promise<Product[]> {
  "use cache";
  cacheCatalog();
  if (categoryIds.length === 0) return [];
  const db = await getDb();
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        isActive,
        ne(products.id, productId),
        sql`exists (select 1 from ${productCategories} where ${productCategories.productId} = ${products.id} and ${inArray(productCategories.categoryId, categoryIds)})`,
      ),
    )
    .orderBy(...orderings.popular)
    .limit(limit);
  return hydrate(rows);
}

export async function getSimilarProducts(product: Product, limit = 4): Promise<Product[]> {
  return similarProducts(product.id, product.categoryIds, limit);
}

export async function getDealProducts(limit = 8): Promise<Product[]> {
  "use cache";
  cacheCatalog();
  const db = await getDb();
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        isActive,
        isNotNull(products.compareAtPriceUzs),
        gt(products.compareAtPriceUzs, products.priceUzs),
      ),
    )
    .orderBy(...orderings.popular)
    .limit(limit);
  return hydrate(rows);
}

export async function getPopularProducts(limit = 8): Promise<Product[]> {
  "use cache";
  cacheCatalog();
  const db = await getDb();
  const rows = await db
    .select()
    .from(products)
    .where(isActive)
    .orderBy(...orderings.popular)
    .limit(limit);
  return hydrate(rows);
}

export async function listAllProductSlugs(): Promise<string[]> {
  "use cache";
  cacheCatalog();
  const db = await getDb();
  const rows = await db.select({ slug: products.slug }).from(products).where(isActive).orderBy(asc(products.id));
  return rows.map((row) => row.slug);
}

export async function countProductsByCategory(): Promise<Record<string, number>> {
  "use cache";
  cacheCatalog();
  const db = await getDb();
  const rows = await db
    .select({ categoryId: productCategories.categoryId, count: sql<number>`count(*)::int` })
    .from(productCategories)
    .innerJoin(products, eq(products.id, productCategories.productId))
    .where(isActive)
    .groupBy(productCategories.categoryId);
  return Object.fromEntries(rows.map((row) => [row.categoryId, row.count]));
}
