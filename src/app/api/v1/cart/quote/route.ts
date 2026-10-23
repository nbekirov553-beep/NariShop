import { z } from "zod";
import { cartItemsSchema } from "@/features/cart/schema";
import { quoteCart } from "@/server/services/cart-quote";

const bodySchema = z.object({ items: cartItemsSchema });

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "invalid_body" } }, { status: 400 });
  }
  return Response.json({ data: await quoteCart(parsed.data.items) });
}
