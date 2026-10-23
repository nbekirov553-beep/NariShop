import type { NextRequest } from "next/server";
import { z } from "zod";
import { parseCatalogQueryStrict } from "@/features/catalog/query";
import { listProducts } from "@/server/repositories/catalog";

export async function GET(request: NextRequest) {
  const parsed = parseCatalogQueryStrict(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return Response.json(
      { error: { code: "invalid_query", details: z.flattenError(parsed.error).fieldErrors } },
      { status: 400 },
    );
  }

  const result = await listProducts(parsed.data);
  return Response.json({
    data: result.items,
    meta: {
      total: result.total,
      page: result.page,
      pageCount: result.pageCount,
      limit: parsed.data.limit,
      brands: result.brands,
      priceBounds: result.priceBounds,
    },
  });
}
