import type { CheckoutData, CreatedOrder } from "@/features/orders/schema";
import type { CartItemInput } from "@/features/cart/schema";
import { quoteCart } from "@/server/services/cart-quote";

// Demo-реализация: заказы живут в памяти процесса и пропадают после перезапуска.
// С Neon создание заказа станет транзакцией с уникальным индексом на idempotency_key.

interface StoredOrder extends CreatedOrder {
  checkout: CheckoutData;
  items: CartItemInput[];
}

const store = globalThis as typeof globalThis & {
  __narishopOrders?: Map<string, StoredOrder>;
  __narishopOrderSeq?: number;
};
store.__narishopOrders ??= new Map();
store.__narishopOrderSeq ??= 0;

export type CreateOrderResult =
  | { ok: true; order: CreatedOrder; replayed: boolean }
  | { ok: false; reason: "empty_cart" | "stock_changed" };

export async function createOrder(
  idempotencyKey: string,
  items: CartItemInput[],
  checkout: CheckoutData,
): Promise<CreateOrderResult> {
  const existing = store.__narishopOrders!.get(idempotencyKey);
  if (existing) {
    const { orderNumber, totalUzs, status, paymentStatus } = existing;
    return { ok: true, order: { orderNumber, totalUzs, status, paymentStatus }, replayed: true };
  }

  const quote = await quoteCart(items);
  if (quote.lines.length === 0 || quote.itemCount === 0) {
    return { ok: false, reason: "empty_cart" };
  }
  if (quote.missingProductIds.length > 0 || quote.lines.some((line) => line.issue)) {
    return { ok: false, reason: "stock_changed" };
  }

  store.__narishopOrderSeq! += 1;
  const order: StoredOrder = {
    orderNumber: `NS-${String(100000 + store.__narishopOrderSeq!)}`,
    totalUzs: quote.subtotalUzs,
    status: "pending",
    paymentStatus: "not_started",
    checkout,
    items,
  };
  store.__narishopOrders!.set(idempotencyKey, order);

  const { orderNumber, totalUzs, status, paymentStatus } = order;
  return { ok: true, order: { orderNumber, totalUzs, status, paymentStatus }, replayed: false };
}
