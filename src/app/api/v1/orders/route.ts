import { z } from "zod";
import { createOrderSchema } from "@/features/orders/schema";
import { createOrder } from "@/server/services/orders";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "validation_failed", details: z.flattenError(parsed.error).fieldErrors } },
      { status: 422 },
    );
  }

  const { idempotencyKey, items, checkout } = parsed.data;
  const result = await createOrder(idempotencyKey, items, checkout);
  if (!result.ok) {
    return Response.json({ error: { code: result.reason } }, { status: 409 });
  }
  return Response.json({ data: result.order }, { status: result.replayed ? 200 : 201 });
}
