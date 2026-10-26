import { describe, expect, it } from "vitest";
import { createLocalDb } from "@/server/db/client";
import { categories, productCategories, productImages, products } from "@/server/db/schema";
import { seedCatalog } from "@/server/db/seed";
import { demoCategories, demoProducts } from "@/server/demo/catalog-data";

describe("database", () => {
  it("brings up a clean database with migrations only", async () => {
    const db = await createLocalDb({ seed: false });
    expect(await db.$count(categories)).toBe(0);
    expect(await db.$count(products)).toBe(0);
  });

  it("seeds the demo catalog idempotently", async () => {
    const db = await createLocalDb({ seed: false });
    await seedCatalog(db);
    await seedCatalog(db);

    const imageCount = demoProducts.reduce((sum, product) => sum + product.images.length, 0);
    const linkCount = demoProducts.reduce((sum, product) => sum + product.categoryIds.length, 0);
    expect(await db.$count(categories)).toBe(demoCategories.length);
    expect(await db.$count(products)).toBe(demoProducts.length);
    expect(await db.$count(productImages)).toBe(imageCount);
    expect(await db.$count(productCategories)).toBe(linkCount);
  });

  it("rejects duplicate SKU", async () => {
    const db = await createLocalDb();
    const [source] = await db.select().from(products).limit(1);
    await expect(db.insert(products).values({ ...source, id: "duplicate", slug: "duplicate" })).rejects.toThrow();
  });
});
