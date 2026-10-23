import { z } from "zod";
import { cartItemsSchema } from "@/features/cart/schema";

// Сообщения об ошибках — ключи словаря `checkout.errors`, текст подставляет интерфейс.
export const deliveryMethods = ["courier", "pickup"] as const;
export const paymentMethods = ["cash", "card_on_delivery"] as const;

export function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, "");
}

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "nameRequired").max(80, "nameTooLong"),
    phone: z
      .string()
      .transform(normalizePhone)
      .pipe(z.string().regex(/^\+998\d{9}$/, "phoneInvalid")),
    email: z
      .union([z.literal(""), z.email("emailInvalid")])
      .optional()
      .transform((value) => value || undefined),
    deliveryMethod: z.enum(deliveryMethods, "deliveryRequired"),
    city: z.string().trim().max(80).optional(),
    address: z.string().trim().max(200).optional(),
    paymentMethod: z.enum(paymentMethods, "paymentRequired"),
    comment: z.string().trim().max(500, "commentTooLong").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.deliveryMethod !== "courier") return;
    if (!value.city || value.city.length < 2) {
      ctx.addIssue({ code: "custom", path: ["city"], message: "cityRequired" });
    }
    if (!value.address || value.address.length < 5) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "addressRequired" });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

export const createOrderSchema = z.object({
  idempotencyKey: z.uuid(),
  items: cartItemsSchema.min(1),
  checkout: checkoutSchema,
});

export type CreateOrderRequest = z.input<typeof createOrderSchema>;

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

export type PaymentStatus = "not_started" | "pending" | "paid" | "failed" | "refunded";

export interface CreatedOrder {
  orderNumber: string;
  totalUzs: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}
