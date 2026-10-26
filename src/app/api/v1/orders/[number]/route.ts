import { getCurrentUser } from "@/server/policies";
import { getOrderForUser } from "@/server/services/orders";

const noStore = { "Cache-Control": "no-store" };

export async function GET(_request: Request, ctx: RouteContext<"/api/v1/orders/[number]">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: { code: "unauthorized" } }, { status: 401, headers: noStore });
  const { number } = await ctx.params;
  const order = await getOrderForUser(number, user.id);
  // Чужой заказ неотличим от несуществующего.
  if (!order) return Response.json({ error: { code: "not_found" } }, { status: 404, headers: noStore });
  return Response.json({ data: order }, { headers: noStore });
}
