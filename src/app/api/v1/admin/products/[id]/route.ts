import { productInputSchema } from "@/features/admin/schema";
import { adminHandler, apiError, json, parseJson } from "@/server/http";
import { getProductForAdmin, setProductActive, updateProduct } from "@/server/services/catalog-admin";

type Ctx = RouteContext<"/api/v1/admin/products/[id]">;

export const GET = adminHandler<Ctx>(async (user, _request, ctx) => {
  const { id } = await ctx.params;
  const product = await getProductForAdmin(user, id);
  return product ? json({ data: product }) : apiError("not_found", 404);
});

export const PUT = adminHandler<Ctx>(async (user, request, ctx) => {
  const parsed = await parseJson(request, productInputSchema);
  if (!parsed.ok) return parsed.response;
  const { id } = await ctx.params;
  const result = await updateProduct(user, id, parsed.data);
  if (!result.ok) {
    return result.errors.form === "notFound" ? apiError("not_found", 404) : apiError("validation_failed", 422, result.errors);
  }
  return json({ data: await getProductForAdmin(user, id) });
});

/** Товар не удаляется физически: он может быть в заказах. DELETE переводит его в архив. */
export const DELETE = adminHandler<Ctx>(async (user, _request, ctx) => {
  const { id } = await ctx.params;
  const archived = await setProductActive(user, id, false);
  return archived ? json({ data: { id, isActive: false } }) : apiError("not_found", 404);
});
