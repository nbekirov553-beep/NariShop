import { describe, expect, it } from "vitest";
import { catalogHref } from "@/features/catalog/href";
import { parseCatalogQueryLenient, parseCatalogQueryStrict } from "@/features/catalog/query";
import { listProducts } from "@/server/repositories/catalog";
import { demoProducts } from "@/server/demo/catalog-data";

describe("catalog query parsing", () => {
  it("drops invalid params on pages instead of failing", () => {
    const query = parseCatalogQueryLenient({ page: "abc", minPrice: "-5", sort: "weird", q: "lumo" });
    expect(query).toMatchObject({ page: 1, sort: "popular", q: "lumo" });
    expect(query.minPrice).toBeUndefined();
  });

  it("rejects invalid params for the API", () => {
    expect(parseCatalogQueryStrict({ limit: "1000" }).success).toBe(false);
    expect(parseCatalogQueryStrict({ brand: "Lumo,Tera", inStock: "1" }).success).toBe(true);
  });

  it("builds URLs without default values and resets page on change", () => {
    const state = { sort: "popular" as const, page: 3, brand: ["Lumo"] };
    expect(catalogHref("/ru/catalog", state, { inStock: true })).toBe("/ru/catalog?brand=Lumo&inStock=1");
    expect(catalogHref("/ru/catalog", { sort: "popular", page: 1 })).toBe("/ru/catalog");
  });
});

describe("listProducts", () => {
  const base = parseCatalogQueryLenient({});

  it("filters by category, brand, stock and price", async () => {
    const result = await listProducts({
      ...base,
      category: "smartphones",
      brand: ["Lumo"],
      inStock: true,
      maxPrice: 4_000_000,
    });
    expect(result.items.map((product) => product.slug)).toEqual(["lumo-s12-128gb"]);
    expect(result.brands).toEqual(["Lumo", "Tera"]);
  });

  it("searches across languages and SKU", async () => {
    const ru = await listProducts({ ...base, q: "холодильник" });
    const sku = await listProducts({ ...base, q: "son-pods2" });
    expect(ru.items.map((product) => product.slug)).toEqual(["kumush-fresh-340"]);
    expect(sku.items.map((product) => product.slug)).toEqual(["sonora-pods-2"]);
  });

  it("sorts by price and paginates", async () => {
    const result = await listProducts({ ...base, sort: "price-asc", limit: 5, page: 2 });
    const prices = result.items.map((product) => product.priceUzs);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(result.page).toBe(2);
    expect(result.pageCount).toBe(Math.ceil(demoProducts.length / 5));
  });

  it("returns an empty result for an unknown category", async () => {
    const result = await listProducts({ ...base, category: "unknown" });
    expect(result.total).toBe(0);
  });
});
