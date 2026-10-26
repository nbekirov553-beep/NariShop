import { productInputSchema } from "@/features/admin/schema";
import { adminHandler, apiError, json, pageParam, parseJson } from "@/server/http";
import { adminListProducts, createProduct, getProductForAdmin } from "@/server/services/catalog-admin";

export const GET = adminHandler(async (user, request) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const result = await adminListProducts(user, {
    q: url.searchParams.get("q")?.slice(0, 80) ?? "",
    status: status === "active" || status === "archived" ? status : "all",
    page: pageParam(url),
  });
  return json({ data: result });
});

export const POST = adminHandler(async (user, request) => {
  const parsed = await parseJson(request, productInputSchema);
  if (!parsed.ok) return parsed.response;
  const result = await createProduct(user, parsed.data);
  if (!result.ok) return apiError("validation_failed", 422, result.errors);
  return json({ data: await getProductForAdmin(user, result.id) }, 201);
});
