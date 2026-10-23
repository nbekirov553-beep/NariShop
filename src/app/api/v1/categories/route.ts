import { countProductsByCategory, listCategories } from "@/server/repositories/catalog";

export async function GET() {
  const [categories, counts] = await Promise.all([listCategories(), countProductsByCategory()]);
  return Response.json({
    data: categories.map((category) => ({
      ...category,
      productCount: counts[category.id] ?? 0,
    })),
  });
}
