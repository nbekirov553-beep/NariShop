import { categoryInputSchema } from "@/features/admin/schema";
import { adminHandler, apiError, json, parseJson } from "@/server/http";
import { getCategoryForAdmin, updateCategory } from "@/server/services/catalog-admin";

type Ctx = RouteContext<"/api/v1/admin/categories/[id]">;

export const GET = adminHandler<Ctx>(async (user, _request, ctx) => {
  const { id } = await ctx.params;
  const category = await getCategoryForAdmin(user, id);
  return category ? json({ data: category }) : apiError("not_found", 404);
});

export const PUT = adminHandler<Ctx>(async (user, request, ctx) => {
  const parsed = await parseJson(request, categoryInputSchema);
  if (!parsed.ok) return parsed.response;
  const { id } = await ctx.params;
  const result = await updateCategory(user, id, parsed.data);
  if (!result.ok) {
    return result.errors.form === "notFound" ? apiError("not_found", 404) : apiError("validation_failed", 422, result.errors);
  }
  return json({ data: await getCategoryForAdmin(user, id) });
});
