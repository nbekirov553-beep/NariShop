import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/features/orders/schema";
import { quoteCart } from "@/server/services/cart-quote";
import { createOrder } from "@/server/services/orders";

const validCheckout = checkoutSchema.parse({
  name: "Dilnoza Karimova",
  phone: "+998 90 123-45-67",
  deliveryMethod: "pickup",
  paymentMethod: "cash",
});

describe("quoteCart", () => {
  it("uses catalog prices, merges duplicates and clamps to stock", async () => {
    const quote = await quoteCart([
      { productId: "p-016", quantity: 1 },
      { productId: "p-016", quantity: 4 },
      { productId: "p-012", quantity: 2 },
    ]);
    const fridge = quote.lines.find((line) => line.productId === "p-016")!;
    expect(fridge).toMatchObject({ requestedQuantity: 5, quantity: 2, issue: "quantity_reduced" });
    expect(quote.subtotalUzs).toBe(7_400_000 * 2 + 690_000 * 2);
  });

  it("flags out-of-stock and unknown products", async () => {
    const quote = await quoteCart([
      { productId: "p-003", quantity: 1 },
      { productId: "does-not-exist", quantity: 1 },
    ]);
    expect(quote.lines[0]).toMatchObject({ quantity: 0, issue: "out_of_stock", lineTotalUzs: 0 });
    expect(quote.missingProductIds).toEqual(["does-not-exist"]);
  });
});

describe("checkoutSchema", () => {
  it("normalizes the phone number", () => {
    expect(validCheckout.phone).toBe("+998901234567");
  });

  it("requires city and address for courier delivery", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, deliveryMethod: "courier" });
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((issue) => issue.message);
    expect(messages).toEqual(expect.arrayContaining(["cityRequired", "addressRequired"]));
  });

  it("rejects a non-Uzbek phone", () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, phone: "+7 900 123 45 67" }).success).toBe(false);
  });
});

describe("createOrder", () => {
  it("returns the same order for a repeated idempotency key", async () => {
    const key = randomUUID();
    const items = [{ productId: "p-012", quantity: 1 }];
    const first = await createOrder(key, items, validCheckout);
    const second = await createOrder(key, items, validCheckout);
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.order.orderNumber).toBe(first.order.orderNumber);
      expect(second.replayed).toBe(true);
      expect(first.order).toMatchObject({ status: "pending", paymentStatus: "not_started", totalUzs: 690_000 });
    }
  });

  it("rejects orders when stock is insufficient", async () => {
    const result = await createOrder(randomUUID(), [{ productId: "p-011", quantity: 5 }], validCheckout);
    expect(result).toEqual({ ok: false, reason: "stock_changed" });
  });
});
