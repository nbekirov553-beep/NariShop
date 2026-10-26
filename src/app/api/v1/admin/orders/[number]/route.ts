import { z } from "zod";
import { orderStatuses, paymentStatuses } from "@/features/orders/schema";
import { adminHandler, apiError, json, parseJson } from "@/server/http";
import { changeOrderStatus, changePaymentStatus, getOrderByNumber } from "@/server/services/orders";

type Ctx = RouteContext<"/api/v1/admin/orders/[number]">;

export const GET = adminHandler<Ctx>(async (user, _request, ctx) => {
  const { number } = await ctx.params;
  const order = await getOrderByNumber(user, number);
  return order ? json({ data: order }) : apiError("not_found", 404);
});

const patchSchema = z
  .object({ status: z.enum(orderStatuses).optional(), paymentStatus: z.enum(paymentStatuses).optional() })
  .refine((value) => Boolean(value.status) !== Boolean(value.paymentStatus), "one_field_required");

/** Меняет либо статус заказа, либо статус оплаты — по одному действию за запрос, каждое попадает в журнал. */
export const PATCH = adminHandler<Ctx>(async (user, request, ctx) => {
  const parsed = await parseJson(request, patchSchema);
  if (!parsed.ok) return parsed.response;
  const { number } = await ctx.params;
  const result = parsed.data.status
    ? await changeOrderStatus(user, number, parsed.data.status)
    : await changePaymentStatus(user, number, parsed.data.paymentStatus!);
  if (!result.ok) return apiError(result.reason, result.reason === "not_found" ? 404 : 409);
  const order = await getOrderByNumber(user, number);
  return json({ data: order });
});
