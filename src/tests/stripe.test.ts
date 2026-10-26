import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { checkoutSchema } from "@/features/orders/schema";
import type { Actor } from "@/server/permissions";
import { getProductForAdmin } from "@/server/services/catalog-admin";

const stripeMock = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(),
  retrieve: vi.fn(),
  orderNumberForPaymentIntent: vi.fn(),
}));

vi.mock("@/server/payments/stripe", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/server/payments/stripe")>();
  return {
    ...original,
    createCheckoutSession: stripeMock.createCheckoutSession,
    orderNumberForPaymentIntent: stripeMock.orderNumberForPaymentIntent,
    getStripe: () => ({ checkout: { sessions: { retrieve: stripeMock.retrieve } } }),
  };
});

const { POST: webhook } = await import("@/app/api/v1/webhooks/stripe/route");
const { createOrder, getOrderByNumber } = await import("@/server/services/orders");

const SECRET = "whsec_test_secret";
const admin: Actor = { id: randomUUID(), role: "admin" };

const online = checkoutSchema.parse({
  name: "Aziz Rahimov",
  phone: "+998 91 555-44-33",
  email: "aziz@example.uz",
  deliveryMethod: "pickup",
  paymentMethod: "card_online",
});

function signed(event: { id: string; type: string; data: { object: Record<string, unknown> } }, secret = SECRET) {
  const payload = JSON.stringify({ object: "event", api_version: "2026-09-30.endive", created: 0, ...event });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request("http://test/api/v1/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": header, "content-type": "application/json" },
    body: payload,
  });
}

function sessionEvent(type: string, orderNumber: string, extra: Record<string, unknown> = {}) {
  return {
    id: `evt_${randomUUID()}`,
    type,
    data: { object: { object: "checkout.session", id: `cs_${orderNumber}`, metadata: { orderNumber }, ...extra } },
  };
}

const stock = async (id: string) => (await getProductForAdmin(admin, id))!.stockQuantity;

async function placeOnline(productId = "p-012", quantity = 1) {
  const result = await createOrder(randomUUID(), [{ productId, quantity }], online, null, {
    locale: "uz",
    baseUrl: "https://shop.test",
  });
  if (!result.ok) throw new Error(result.reason);
  return result.order;
}

beforeAll(() => {
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
});

beforeEach(() => {
  vi.clearAllMocks();
  stripeMock.createCheckoutSession.mockImplementation(async ({ orderNumber }: { orderNumber: string }) => ({
    id: `cs_${orderNumber}`,
    url: `https://checkout.stripe.test/${orderNumber}`,
  }));
});

describe("оформление с оплатой картой онлайн", () => {
  it("резервирует товар, ставит оплату в ожидание и возвращает страницу Stripe", async () => {
    const before = await stock("p-012");
    const order = await placeOnline();
    expect(order).toMatchObject({ status: "pending", paymentStatus: "pending" });
    expect(order.paymentUrl).toBe(`https://checkout.stripe.test/${order.orderNumber}`);
    expect(await stock("p-012")).toBe(before - 1);
    expect(stripeMock.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        orderNumber: order.orderNumber,
        amountUzs: order.totalUzs,
        locale: "uz",
        baseUrl: "https://shop.test",
        email: "aziz@example.uz",
      }),
    );
  });

  it("повторная отправка возвращает тот же заказ и открытую сессию", async () => {
    const key = randomUUID();
    const context = { locale: "ru" as const, baseUrl: "https://shop.test" };
    const first = await createOrder(key, [{ productId: "p-012", quantity: 1 }], online, null, context);
    stripeMock.retrieve.mockResolvedValue({ status: "open", url: "https://checkout.stripe.test/again" });
    const second = await createOrder(key, [{ productId: "p-012", quantity: 1 }], online, null, context);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second).toMatchObject({ replayed: true, order: { orderNumber: first.order.orderNumber } });
    expect(second.order.paymentUrl).toBe("https://checkout.stripe.test/again");
    expect(stripeMock.retrieve).toHaveBeenCalledWith(`cs_${first.order.orderNumber}`);
    expect(stripeMock.createCheckoutSession).toHaveBeenCalledTimes(1);
    // Ключ для Stripe — UUID заказа, а не числовой id: id повторяются после сброса БД и в разных окружениях.
    expect(stripeMock.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: key }));
  });

  it("если Stripe недоступен, заказ отменяется и товар возвращается на склад", async () => {
    stripeMock.createCheckoutSession.mockRejectedValueOnce(new Error("network"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});
    const before = await stock("p-012");
    const result = await createOrder(randomUUID(), [{ productId: "p-012", quantity: 2 }], online, null);
    expect(result).toEqual({ ok: false, reason: "payment_unavailable" });
    expect(await stock("p-012")).toBe(before);
  });
});

describe("webhook Stripe", () => {
  it("отклоняет запрос без подписи или с чужой подписью", async () => {
    const order = await placeOnline();
    const event = sessionEvent("checkout.session.completed", order.orderNumber, { payment_status: "paid" });
    expect((await webhook(signed(event, "whsec_other"))).status).toBe(400);
    const unsigned = new Request("http://test", { method: "POST", body: JSON.stringify(event) });
    expect((await webhook(unsigned)).status).toBe(400);
    expect((await getOrderByNumber(admin, order.orderNumber))?.paymentStatus).toBe("pending");
  });

  it("оплата подтверждается подписанным событием, повтор события ничего не меняет", async () => {
    const order = await placeOnline();
    const event = sessionEvent("checkout.session.completed", order.orderNumber, { payment_status: "paid" });
    const first = await webhook(signed(event));
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ changed: true });
    expect((await getOrderByNumber(admin, order.orderNumber))?.paymentStatus).toBe("paid");

    const replay = await webhook(signed(event));
    expect(await replay.json()).toMatchObject({ changed: false });
  });

  it("отложенная оплата: completed с unpaid ждёт, async_payment_succeeded подтверждает", async () => {
    const order = await placeOnline();
    await webhook(signed(sessionEvent("checkout.session.completed", order.orderNumber, { payment_status: "unpaid" })));
    expect((await getOrderByNumber(admin, order.orderNumber))?.paymentStatus).toBe("pending");
    await webhook(signed(sessionEvent("checkout.session.async_payment_succeeded", order.orderNumber)));
    expect((await getOrderByNumber(admin, order.orderNumber))?.paymentStatus).toBe("paid");
  });

  it("истёкшая сессия отменяет заказ и возвращает товар", async () => {
    const before = await stock("p-016");
    const order = await placeOnline("p-016", 2);
    expect(await stock("p-016")).toBe(before - 2);
    await webhook(signed(sessionEvent("checkout.session.expired", order.orderNumber)));
    expect(await getOrderByNumber(admin, order.orderNumber)).toMatchObject({ status: "cancelled", paymentStatus: "failed" });
    expect(await stock("p-016")).toBe(before);
  });

  it("полный возврат переводит оплату в refunded, частичный — нет", async () => {
    const order = await placeOnline();
    await webhook(signed(sessionEvent("checkout.session.completed", order.orderNumber, { payment_status: "paid" })));
    stripeMock.orderNumberForPaymentIntent.mockResolvedValue(order.orderNumber);
    const charge = (refunded: boolean) => ({
      id: `evt_${randomUUID()}`,
      type: "charge.refunded",
      data: { object: { object: "charge", id: "ch_1", refunded, payment_intent: "pi_1", metadata: {} } },
    });

    await webhook(signed(charge(false)));
    expect((await getOrderByNumber(admin, order.orderNumber))?.paymentStatus).toBe("paid");
    await webhook(signed(charge(true)));
    expect(stripeMock.orderNumberForPaymentIntent).toHaveBeenCalledWith("pi_1");
    expect((await getOrderByNumber(admin, order.orderNumber))?.paymentStatus).toBe("refunded");
  });

  it("не трогает заказы с оплатой при получении и неизвестные заказы", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const cash = await createOrder(
      randomUUID(),
      [{ productId: "p-012", quantity: 1 }],
      { ...online, paymentMethod: "cash" },
      null,
    );
    if (!cash.ok) throw new Error("order");
    const event = sessionEvent("checkout.session.completed", cash.order.orderNumber, { payment_status: "paid" });
    expect(await (await webhook(signed(event))).json()).toMatchObject({ changed: false });
    expect((await getOrderByNumber(admin, cash.order.orderNumber))?.paymentStatus).toBe("not_started");

    const unknown = await webhook(signed(sessionEvent("checkout.session.completed", "NS-1", { payment_status: "paid" })));
    expect(unknown.status).toBe(200);
  });
});
