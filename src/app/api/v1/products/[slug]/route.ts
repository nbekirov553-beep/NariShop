import { getProductBySlug } from "@/server/repositories/catalog";

export async function GET(_request: Request, ctx: RouteContext<"/api/v1/products/[slug]">) {
  const { slug } = await ctx.params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return Response.json({ error: { code: "not_found" } }, { status: 404 });
  }
  return Response.json({ data: product });
}
