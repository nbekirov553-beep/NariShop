import { orderStatuses, type OrderStatus } from "@/features/orders/schema";
import { adminHandler, json, pageParam } from "@/server/http";
import { listOrders } from "@/server/services/orders";

export const GET = adminHandler(async (user, request) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const result = await listOrders(user, {
    status: orderStatuses.includes(status as OrderStatus) ? (status as OrderStatus) : undefined,
    q: url.searchParams.get("q")?.trim().slice(0, 80) || undefined,
    page: pageParam(url),
  });
  return json({ data: result });
});
