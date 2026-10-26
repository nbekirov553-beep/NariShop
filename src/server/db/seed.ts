import { inArray, sql } from "drizzle-orm";
import { locales, type Localized } from "@/lib/i18n/config";
import { demoCategories, demoProducts } from "@/server/demo/catalog-data";
import type { Db } from "./client";
import { categories, productCategories, productImages, products } from "./schema";

export function buildSearchText(
  product: { brand: string; sku: string; name: Localized },
  categoryNames: Localized[],
): string {
  return [
    product.brand,
    product.sku,
    ...locales.map((locale) => product.name[locale]),
    ...categoryNames.flatMap((name) => locales.map((locale) => name[locale])),
  ]
    .join(" ")
    .toLowerCase();
}

// Переносит demo-каталог в БД. Повторный запуск обновляет записи, а не создаёт дубли.
export async function seedCatalog(db: Db): Promise<{ categories: number; products: number }> {
  await db.transaction(async (tx) => {
    await tx
      .insert(categories)
      .values(
        demoCategories.map((category) => ({
          id: category.id,
          parentId: category.parentId,
          slug: category.slug,
          name: category.name,
          description: category.description,
          icon: category.icon,
          imageUrl: category.image,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        })),
      )
      .onConflictDoUpdate({
        target: categories.id,
        set: {
          parentId: sql`excluded.parent_id`,
          slug: sql`excluded.slug`,
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          icon: sql`excluded.icon`,
          imageUrl: sql`excluded.image_url`,
          sortOrder: sql`excluded.sort_order`,
          isActive: sql`excluded.is_active`,
          updatedAt: sql`now()`,
        },
      });

    await tx
      .insert(products)
      .values(
        demoProducts.map((product) => ({
          id: product.id,
          sku: product.sku,
          slug: product.slug,
          brand: product.brand,
          name: product.name,
          description: product.description,
          priceUzs: product.priceUzs,
          compareAtPriceUzs: product.compareAtPriceUzs,
          stockQuantity: product.stockQuantity,
          isActive: product.isActive,
          warrantyMonths: product.warrantyMonths,
          specifications: product.specifications,
          popularity: product.popularity,
          searchText: buildSearchText(
            product,
            demoCategories
              .filter((category) => product.categoryIds.includes(category.id))
              .map((category) => category.name),
          ),
          createdAt: new Date(product.createdAt),
        })),
      )
      .onConflictDoUpdate({
        target: products.id,
        set: {
          sku: sql`excluded.sku`,
          slug: sql`excluded.slug`,
          brand: sql`excluded.brand`,
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          priceUzs: sql`excluded.price_uzs`,
          compareAtPriceUzs: sql`excluded.compare_at_price_uzs`,
          stockQuantity: sql`excluded.stock_quantity`,
          isActive: sql`excluded.is_active`,
          warrantyMonths: sql`excluded.warranty_months`,
          specifications: sql`excluded.specifications`,
          popularity: sql`excluded.popularity`,
          searchText: sql`excluded.search_text`,
          updatedAt: sql`now()`,
        },
      });

    const productIds = demoProducts.map((product) => product.id);
    await tx.delete(productImages).where(inArray(productImages.productId, productIds));
    await tx.delete(productCategories).where(inArray(productCategories.productId, productIds));

    await tx.insert(productImages).values(
      demoProducts.flatMap((product) =>
        product.images.map((image, index) => ({
          productId: product.id,
          url: image.url,
          alt: image.alt,
          sortOrder: index,
          isPrimary: image.isPrimary,
        })),
      ),
    );

    await tx.insert(productCategories).values(
      demoProducts.flatMap((product) =>
        product.categoryIds.map((categoryId, index) => ({
          productId: product.id,
          categoryId,
          sortOrder: index,
        })),
      ),
    );
  });

  return { categories: demoCategories.length, products: demoProducts.length };
}
