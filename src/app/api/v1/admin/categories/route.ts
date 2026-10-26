import { categoryInputSchema } from "@/features/admin/schema";
import { adminHandler, apiError, json, parseJson } from "@/server/http";
import { adminListCategories, createCategory, getCategoryForAdmin } from "@/server/services/catalog-admin";

export const GET = adminHandler(async (user) => json({ data: await adminListCategories(user) }));

export const POST = adminHandler(async (user, request) => {
  const parsed = await parseJson(request, categoryInputSchema);
  if (!parsed.ok) return parsed.response;
  const result = await createCategory(user, parsed.data);
  if (!result.ok) return apiError("validation_failed", 422, result.errors);
  return json({ data: await getCategoryForAdmin(user, result.id) }, 201);
});
