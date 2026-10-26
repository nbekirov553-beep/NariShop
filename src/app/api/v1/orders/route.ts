import { z } from "zod";
import { createOrderSchema } from "@/features/orders/schema";
import { isStripeEnabled } from "@/server/payments/stripe";
import { getCurrentUser } from "@/server/policies";
import { createOrder, listOrdersForUser } from "@/server/services/orders";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: { code: "unauthorized" } }, { status: 401, headers: noStore });
  const orders = await listOrdersForUser(user.id);
  return Response.json({ data: orders }, { headers: noStore });
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "validation_failed", details: z.flattenError(parsed.error).fieldErrors } },
      { status: 422 },
    );
  }

  const { idempotencyKey, items, checkout, locale } = parsed.data;
  if (checkout.paymentMethod === "card_online" && !isStripeEnabled()) {
    return Response.json({ error: { code: "payment_unavailable" } }, { status: 409 });
  }
  const user = await getCurrentUser();
  // Адрес возврата со страницы оплаты — тот же хост, с которого оформлен заказ.
  const baseUrl = new URL(request.url).origin;
  const result = await createOrder(idempotencyKey, items, checkout, user?.id ?? null, { locale, baseUrl });
  if (!result.ok) {
    return Response.json({ error: { code: result.reason } }, { status: 409 });
  }
  return Response.json({ data: result.order }, { status: result.replayed ? 200 : 201 });
}
