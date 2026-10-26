import { and, asc, desc, eq, ilike, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import type { CategoryInput, FieldErrors, ProductInput } from "@/features/admin/schema";
import type { Localized } from "@/lib/i18n/config";
import { getDb } from "@/server/db/client";
import { categories, productCategories, productImages, products } from "@/server/db/schema";
import { buildSearchText } from "@/server/db/seed";
import { assertCan, type Actor } from "@/server/permissions";
import { CATALOG_TAG } from "@/server/repositories/catalog";
import { logAction } from "./audit";

// Управление каталогом (только роль admin). После каждого изменения кэш витрины сбрасывается сразу.

export type SaveResult = { ok: true; id: string } | { ok: false; errors: FieldErrors };

function refreshCatalog() {
  revalidateTag(CATALOG_TAG, { expire: 0 });
}

export interface AdminProductRow {
  id: string;
  sku: string;
  slug: string;
  brand: string;
  name: Localized;
  priceUzs: number;
  stockQuantity: number;
  isActive: boolean;
  imageUrl: string | null;
}

export async function adminListProducts(
  actor: Actor | null,
  { q = "", status = "all", page = 1, limit = 20 }: { q?: string; status?: "all" | "active" | "archived"; page?: number; limit?: number } = {},
) {
  assertCan(actor, "catalog:manage");
  const db = await getDb();
  const conditions: SQL[] = [];
  if (status !== "all") conditions.push(eq(products.isActive, status === "active"));
  if (q.trim()) {
    const pattern = `%${q.trim().toLowerCase().replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(products.searchText, pattern), ilike(products.slug, pattern))!);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const total = await db.$count(products, where);
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(Math.max(page, 1), pageCount);
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      slug: products.slug,
      brand: products.brand,
      name: products.name,
      priceUzs: products.priceUzs,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
      imageUrl: sql<string | null>`(select pi.url from product_images pi where pi.product_id = ${products}.id order by pi.is_primary desc, pi.sort_order limit 1)`,
    })
    .from(products)
    .where(where)
    .orderBy(desc(products.updatedAt), asc(products.id))
    .limit(limit)
    .offset((current - 1) * limit);
  return { items: rows as AdminProductRow[], total, page: current, pageCount };
}

export async function getProductForAdmin(actor: Actor | null, id: string): Promise<(ProductInput & { id: string }) | null> {
  assertCan(actor, "catalog:manage");
  const db = await getDb();
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) return null;
  const [links, images] = await Promise.all([
    db
      .select({ categoryId: productCategories.categoryId })
      .from(productCategories)
      .where(eq(productCategories.productId, id))
      .orderBy(asc(productCategories.sortOrder)),
    db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder))
      .limit(1),
  ]);
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
    warrantyMonths: row.warrantyMonths,
    isActive: row.isActive,
    categoryIds: links.map((link) => link.categoryId),
    imageUrl: images[0]?.url ?? null,
  };
}

async function productConflicts(input: ProductInput, exceptId?: string): Promise<FieldErrors> {
  const db = await getDb();
  const notSelf = exceptId ? [ne(products.id, exceptId)] : [];
  const [skuTaken, slugTaken, knownCategories] = await Promise.all([
    db.$count(products, and(eq(products.sku, input.sku), ...notSelf)),
    db.$count(products, and(eq(products.slug, input.slug), ...notSelf)),
    db.select({ id: categories.id }).from(categories).where(inArray(categories.id, input.categoryIds)),
  ]);
  const errors: FieldErrors = {};
  if (skuTaken) errors.sku = "skuTaken";
  if (slugTaken) errors.slug = "slugTaken";
  if (knownCategories.length !== new Set(input.categoryIds).size) errors.categoryIds = "categoryRequired";
  return errors;
}

async function categoryNames(ids: string[]): Promise<Localized[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const rows = await db.select({ id: categories.id, name: categories.name }).from(categories).where(inArray(categories.id, ids));
  return ids.flatMap((id) => rows.filter((row) => row.id === id).map((row) => row.name));
}

function productValues(input: ProductInput, searchText: string) {
  return {
    sku: input.sku,
    slug: input.slug,
    brand: input.brand,
    name: input.name,
    description: input.description,
    priceUzs: input.priceUzs,
    compareAtPriceUzs: input.compareAtPriceUzs,
    stockQuantity: input.stockQuantity,
    warrantyMonths: input.warrantyMonths,
    isActive: input.isActive,
    searchText,
  };
}

export async function createProduct(actor: Actor | null, input: ProductInput): Promise<SaveResult> {
  assertCan(actor, "catalog:manage");
  const errors = await productConflicts(input);
  if (Object.keys(errors).length) return { ok: false, errors };

  const db = await getDb();
  const id = `p-${crypto.randomUUID().slice(0, 8)}`;
  const searchText = buildSearchText(input, await categoryNames(input.categoryIds));
  await db.transaction(async (tx) => {
    await tx.insert(products).values({ id, ...productValues(input, searchText) });
    await tx.insert(productCategories).values(input.categoryIds.map((categoryId, index) => ({ productId: id, categoryId, sortOrder: index })));
    if (input.imageUrl) {
      await tx.insert(productImages).values({ productId: id, url: input.imageUrl, alt: input.name, isPrimary: true });
    }
    await logAction(tx, {
      actorUserId: actor.id,
      action: "product.created",
      entityType: "product",
      entityId: id,
      metadata: { sku: input.sku, priceUzs: input.priceUzs, stockQuantity: input.stockQuantity },
    });
  });
  refreshCatalog();
  return { ok: true, id };
}

export async function updateProduct(actor: Actor | null, id: string, input: ProductInput): Promise<SaveResult> {
  assertCan(actor, "catalog:manage");
  const before = await getProductForAdmin(actor, id);
  if (!before) return { ok: false, errors: { form: "notFound" } };
  const errors = await productConflicts(input, id);
  if (Object.keys(errors).length) return { ok: false, errors };

  const changed = (Object.keys(input) as Array<keyof ProductInput>).filter(
    (key) => JSON.stringify(input[key]) !== JSON.stringify(before[key]),
  );
  const db = await getDb();
  const searchText = buildSearchText(input, await categoryNames(input.categoryIds));
  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({ ...productValues(input, searchText), updatedAt: sql`now()` })
      .where(eq(products.id, id));
    if (changed.includes("categoryIds")) {
      await tx.delete(productCategories).where(eq(productCategories.productId, id));
      await tx.insert(productCategories).values(input.categoryIds.map((categoryId, index) => ({ productId: id, categoryId, sortOrder: index })));
    }
    if (changed.includes("imageUrl")) {
      await tx.delete(productImages).where(eq(productImages.productId, id));
      if (input.imageUrl) {
        await tx.insert(productImages).values({ productId: id, url: input.imageUrl, alt: input.name, isPrimary: true });
      }
    }
    const metadata: Record<string, unknown> = { changed };
    if (changed.includes("priceUzs")) metadata.priceUzs = { from: before.priceUzs, to: input.priceUzs };
    if (changed.includes("stockQuantity")) metadata.stockQuantity = { from: before.stockQuantity, to: input.stockQuantity };
    if (changed.includes("isActive")) metadata.isActive = { from: before.isActive, to: input.isActive };
    await logAction(tx, { actorUserId: actor.id, action: "product.updated", entityType: "product", entityId: id, metadata });
  });
  refreshCatalog();
  return { ok: true, id };
}

/** Удаление = архивирование: товар уже может быть в заказах, история должна сохраниться. */
export async function setProductActive(actor: Actor | null, id: string, isActive: boolean): Promise<boolean> {
  assertCan(actor, "catalog:manage");
  const db = await getDb();
  const updated = await db.transaction(async (tx) => {
    const rows = await tx
      .update(products)
      .set({ isActive, updatedAt: sql`now()` })
      .where(eq(products.id, id))
      .returning({ id: products.id });
    if (rows.length === 0) return false;
    await logAction(tx, {
      actorUserId: actor.id,
      action: isActive ? "product.restored" : "product.archived",
      entityType: "product",
      entityId: id,
    });
    return true;
  });
  if (updated) refreshCatalog();
  return updated;
}

export interface AdminCategoryRow extends CategoryInput {
  id: string;
  productCount: number;
}

export async function adminListCategories(actor: Actor | null): Promise<AdminCategoryRow[]> {
  assertCan(actor, "catalog:manage");
  const db = await getDb();
  const rows = await db
    .select({
      category: categories,
      productCount: sql<number>`(select count(*)::int from product_categories pc where pc.category_id = ${categories}.id)`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));
  return rows.map(({ category, productCount }) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    icon: category.icon,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    imageUrl: category.imageUrl,
    productCount,
  }));
}

export async function getCategoryForAdmin(actor: Actor | null, id: string): Promise<AdminCategoryRow | null> {
  const list = await adminListCategories(actor);
  return list.find((category) => category.id === id) ?? null;
}

async function slugTaken(slugValue: string, exceptId?: string): Promise<boolean> {
  const db = await getDb();
  const count = await db.$count(
    categories,
    and(eq(categories.slug, slugValue), ...(exceptId ? [ne(categories.id, exceptId)] : [])),
  );
  return count > 0;
}

function categoryValues(input: CategoryInput) {
  return {
    slug: input.slug,
    name: input.name,
    description: input.description,
    icon: input.icon,
    imageUrl: input.imageUrl,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  };
}

export async function createCategory(actor: Actor | null, input: CategoryInput): Promise<SaveResult> {
  assertCan(actor, "catalog:manage");
  if (await slugTaken(input.slug)) return { ok: false, errors: { slug: "slugTaken" } };
  const db = await getDb();
  const id = `cat-${input.slug}`;
  await db.transaction(async (tx) => {
    await tx.insert(categories).values({ id, parentId: null, ...categoryValues(input) });
    await logAction(tx, { actorUserId: actor.id, action: "category.created", entityType: "category", entityId: id });
  });
  refreshCatalog();
  return { ok: true, id };
}

export async function updateCategory(actor: Actor | null, id: string, input: CategoryInput): Promise<SaveResult> {
  assertCan(actor, "catalog:manage");
  const before = await getCategoryForAdmin(actor, id);
  if (!before) return { ok: false, errors: { form: "notFound" } };
  if (await slugTaken(input.slug, id)) return { ok: false, errors: { slug: "slugTaken" } };

  const changed = (Object.keys(input) as Array<keyof CategoryInput>).filter(
    (key) => JSON.stringify(input[key]) !== JSON.stringify(before[key]),
  );
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(categories)
      .set({ ...categoryValues(input), updatedAt: sql`now()` })
      .where(eq(categories.id, id));
    if (changed.includes("name")) {
      // Поиск по товарам включает названия категорий — пересобираем search_text у товаров категории.
      const linked = await tx
        .select({ product: products })
        .from(products)
        .innerJoin(productCategories, eq(productCategories.productId, products.id))
        .where(eq(productCategories.categoryId, id));
      for (const { product } of linked) {
        const links = await tx
          .select({ name: categories.name })
          .from(productCategories)
          .innerJoin(categories, eq(categories.id, productCategories.categoryId))
          .where(eq(productCategories.productId, product.id))
          .orderBy(asc(productCategories.sortOrder));
        await tx
          .update(products)
          .set({ searchText: buildSearchText(product, links.map((link) => link.name)) })
          .where(eq(products.id, product.id));
      }
    }
    await logAction(tx, {
      actorUserId: actor.id,
      action: "category.updated",
      entityType: "category",
      entityId: id,
      metadata: { changed },
    });
  });
  refreshCatalog();
  return { ok: true, id };
}
