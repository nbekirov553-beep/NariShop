import { and, asc, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import type { CartItemInput } from "@/features/cart/schema";
import {
  canTransition,
  type CheckoutData,
  type CreatedOrder,
  type OrderStatus,
  type PaymentStatus,
} from "@/features/orders/schema";
import type { Locale, Localized } from "@/lib/i18n/config";
import { lineTotal } from "@/lib/money";
import { getDb } from "@/server/db/client";
import { orderItems, orders, payments, products } from "@/server/db/schema";
import { manualPaymentTransitions, providerFor, stripePaymentTransitions } from "@/server/payments";
import { getUsdRate } from "@/server/fx";
import { createCheckoutSession, getStripe } from "@/server/payments/stripe";
import { assertCan, type Actor } from "@/server/permissions";
import { CATALOG_TAG } from "@/server/repositories/catalog";
import { logAction } from "./audit";

type OrderRow = typeof orders.$inferSelect;
type Tx = Parameters<Parameters<Awaited<ReturnType<typeof getDb>>["transaction"]>[0]>[0];

export type CreateOrderResult =
  | { ok: true; order: CreatedOrder; replayed: boolean }
  | { ok: false; reason: "empty_cart" | "stock_changed" | "payment_unavailable" };

class OrderRejected extends Error {
  constructor(public readonly reason: "empty_cart" | "stock_changed") {
    super(reason);
  }
}

function toCreated(row: OrderRow, paymentUrl: string | null = null): CreatedOrder {
  return {
    orderNumber: row.orderNumber,
    totalUzs: row.totalUzs,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentUrl,
  };
}

/** Где покупатель вернётся после страницы оплаты Stripe. */
export interface PaymentContext {
  locale: Locale;
  baseUrl: string;
}

async function restock(tx: Tx, orderId: number): Promise<void> {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    if (!item.productId) continue;
    await tx
      .update(products)
      .set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`, updatedAt: sql`now()` })
      .where(eq(products.id, item.productId));
  }
}

async function stripePayment(orderId: number) {
  const db = await getDb();
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.orderId, orderId), eq(payments.provider, "stripe")))
    .limit(1);
  return payment ?? null;
}

/** Повтор отправки формы: возвращаем ту же страницу оплаты, пока сессия Stripe открыта. */
async function openPaymentUrl(row: OrderRow): Promise<string | null> {
  if (row.paymentMethod !== "card_online" || row.paymentStatus !== "pending") return null;
  const payment = await stripePayment(row.id);
  if (!payment?.providerPaymentId) return null;
  try {
    const session = await getStripe().checkout.sessions.retrieve(payment.providerPaymentId);
    return session.status === "open" ? session.url : null;
  } catch (error) {
    console.error("[stripe] session retrieve failed", row.orderNumber, error);
    return null;
  }
}

/**
 * Создаёт сессию Stripe после коммита заказа (сетевой вызов не держит транзакцию).
 * Если Stripe недоступен, заказ отменяется и товар возвращается — покупатель может выбрать другой способ.
 */
async function startStripeCheckout(order: OrderRow, context: PaymentContext): Promise<string | null> {
  try {
    const session = await createCheckoutSession({
      idempotencyKey: order.idempotencyKey,
      orderNumber: order.orderNumber,
      amountUzs: order.totalUzs,
      locale: context.locale,
      baseUrl: context.baseUrl,
      email: order.checkout.email,
      usdRate: getUsdRate(),
    });
    const db = await getDb();
    await db
      .update(payments)
      .set({ providerPaymentId: session.id, updatedAt: sql`now()` })
      .where(and(eq(payments.orderId, order.id), eq(payments.provider, "stripe")));
    return session.url;
  } catch (error) {
    console.error("[stripe] checkout session failed", order.orderNumber, error);
    const db = await getDb();
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({ status: "cancelled", paymentStatus: "failed", updatedAt: sql`now()` })
        .where(eq(orders.id, order.id));
      await tx.update(payments).set({ status: "failed", updatedAt: sql`now()` }).where(eq(payments.orderId, order.id));
      await restock(tx, order.id);
      await logAction(tx, {
        actorUserId: null,
        action: "order.status_changed",
        entityType: "order",
        entityId: order.orderNumber,
        metadata: { from: order.status, to: "cancelled", source: "stripe", reason: "checkout_session_failed" },
      });
    });
    revalidateTag(CATALOG_TAG, "max");
    return null;
  }
}

async function findByIdempotencyKey(key: string): Promise<OrderRow | null> {
  const db = await getDb();
  const [row] = await db.select().from(orders).where(eq(orders.idempotencyKey, key)).limit(1);
  return row ?? null;
}

/**
 * Атомарно: списывает остатки (UPDATE … WHERE stock >= qty), создаёт заказ, позиции-снимки и платёж.
 * Любая нехватка остатка откатывает всю транзакцию. Повтор с тем же ключом возвращает уже созданный заказ.
 */
export async function createOrder(
  idempotencyKey: string,
  items: CartItemInput[],
  checkout: CheckoutData,
  userId: string | null = null,
  context: PaymentContext = { locale: "ru", baseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000" },
): Promise<CreateOrderResult> {
  const existing = await findByIdempotencyKey(idempotencyKey);
  if (existing) return { ok: true, order: toCreated(existing, await openPaymentUrl(existing)), replayed: true };

  const requested = new Map<string, number>();
  for (const item of items) {
    if (item.quantity > 0) requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
  }
  if (requested.size === 0) return { ok: false, reason: "empty_cart" };

  const db = await getDb();
  const provider = providerFor(checkout.paymentMethod);

  try {
    const order = await db.transaction(async (tx) => {
      const lines: Array<{ productId: string; sku: string; name: Localized; unitPriceUzs: number; quantity: number }> = [];
      for (const [productId, quantity] of [...requested].sort(([a], [b]) => a.localeCompare(b))) {
        const [row] = await tx
          .update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} - ${quantity}`, updatedAt: sql`now()` })
          .where(and(eq(products.id, productId), eq(products.isActive, true), gte(products.stockQuantity, quantity)))
          .returning({ sku: products.sku, name: products.name, priceUzs: products.priceUzs });
        if (!row) throw new OrderRejected("stock_changed");
        lines.push({ productId, sku: row.sku, name: row.name, unitPriceUzs: row.priceUzs, quantity });
      }

      const subtotalUzs = lines.reduce((sum, line) => sum + lineTotal(line.unitPriceUzs, line.quantity), 0);
      const [created] = await tx
        .insert(orders)
        .values({
          idempotencyKey,
          userId,
          paymentMethod: checkout.paymentMethod,
          deliveryMethod: checkout.deliveryMethod,
          subtotalUzs,
          deliveryFeeUzs: 0,
          totalUzs: subtotalUzs,
          checkout,
        })
        .returning();

      await tx.insert(orderItems).values(
        lines.map((line) => ({
          orderId: created.id,
          ...line,
          lineTotalUzs: lineTotal(line.unitPriceUzs, line.quantity),
        })),
      );

      await tx.insert(payments).values({
        orderId: created.id,
        provider: provider.id,
        status: provider.initialStatus,
        amountUzs: created.totalUzs,
        idempotencyKey: `order:${created.id}`,
      });
      if (provider.initialStatus !== created.paymentStatus) {
        const [updated] = await tx
          .update(orders)
          .set({ paymentStatus: provider.initialStatus })
          .where(eq(orders.id, created.id))
          .returning();
        return updated;
      }
      return created;
    });

    revalidateTag(CATALOG_TAG, "max");
    if (provider.id !== "stripe") return { ok: true, order: toCreated(order), replayed: false };
    const paymentUrl = await startStripeCheckout(order, context);
    if (!paymentUrl) return { ok: false, reason: "payment_unavailable" };
    return { ok: true, order: toCreated(order, paymentUrl), replayed: false };
  } catch (error) {
    if (error instanceof OrderRejected) return { ok: false, reason: error.reason };
    // Параллельная отправка с тем же ключом: уникальный индекс не дал создать дубль.
    const concurrent = await findByIdempotencyKey(idempotencyKey);
    if (concurrent) return { ok: true, order: toCreated(concurrent, await openPaymentUrl(concurrent)), replayed: true };
    throw error;
  }
}

export interface OrderSummary {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalUzs: number;
  itemCount: number;
  createdAt: string;
  customerName: string;
}

export interface OrderDetails extends OrderSummary {
  subtotalUzs: number;
  deliveryFeeUzs: number;
  deliveryMethod: CheckoutData["deliveryMethod"];
  paymentMethod: CheckoutData["paymentMethod"];
  checkout: CheckoutData;
  items: Array<{
    productId: string | null;
    sku: string;
    name: Localized;
    unitPriceUzs: number;
    quantity: number;
    lineTotalUzs: number;
  }>;
}

async function summarize(rows: OrderRow[]): Promise<OrderSummary[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
  const counts = await db
    .select({ orderId: orderItems.orderId, count: sql<number>`sum(${orderItems.quantity})::int` })
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((row) => row.id),
      ),
    )
    .groupBy(orderItems.orderId);
  const countMap = new Map(counts.map((item) => [item.orderId, item.count]));
  return rows.map((row) => ({
    orderNumber: row.orderNumber,
    status: row.status,
    paymentStatus: row.paymentStatus,
    totalUzs: row.totalUzs,
    itemCount: countMap.get(row.id) ?? 0,
    createdAt: row.createdAt.toISOString(),
    customerName: row.checkout.name,
  }));
}

async function details(row: OrderRow): Promise<OrderDetails> {
  const db = await getDb();
  const [[summary], items] = await Promise.all([
    summarize([row]),
    db
      .select({
        productId: orderItems.productId,
        sku: orderItems.sku,
        name: orderItems.name,
        unitPriceUzs: orderItems.unitPriceUzs,
        quantity: orderItems.quantity,
        lineTotalUzs: orderItems.lineTotalUzs,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, row.id))
      .orderBy(asc(orderItems.id)),
  ]);
  return {
    ...summary,
    subtotalUzs: row.subtotalUzs,
    deliveryFeeUzs: row.deliveryFeeUzs,
    deliveryMethod: row.deliveryMethod,
    paymentMethod: row.paymentMethod,
    checkout: row.checkout,
    items,
  };
}

/** Заказы покупателя: только с его userId. */
export async function listOrdersForUser(userId: string): Promise<OrderSummary[]> {
  const db = await getDb();
  const rows = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  return summarize(rows);
}

/** Чужой или несуществующий заказ — одинаково null, чтобы не раскрывать номера. */
export async function getOrderForUser(orderNumber: string, userId: string): Promise<OrderDetails | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, userId)))
    .limit(1);
  return row ? details(row) : null;
}

export interface OrderListFilter {
  status?: OrderStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export async function listOrders(actor: Actor | null, filter: OrderListFilter = {}) {
  assertCan(actor, "orders:manage");
  const db = await getDb();
  const limit = filter.limit ?? 20;
  const conditions: SQL[] = [];
  if (filter.status) conditions.push(eq(orders.status, filter.status));
  if (filter.q) {
    const pattern = `%${filter.q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, pattern),
        sql`${orders.checkout}->>'name' ilike ${pattern}`,
        sql`${orders.checkout}->>'phone' ilike ${pattern}`,
      )!,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const total = await db.$count(orders, where);
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(filter.page ?? 1, 1), pageCount);
  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(limit)
    .offset((page - 1) * limit);
  return { items: await summarize(rows), total, page, pageCount };
}

export async function getOrderByNumber(actor: Actor | null, orderNumber: string): Promise<OrderDetails | null> {
  assertCan(actor, "orders:manage");
  const db = await getDb();
  const [row] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return row ? details(row) : null;
}

export type ChangeResult = { ok: true } | { ok: false; reason: "not_found" | "invalid_transition" };

export async function changeOrderStatus(actor: Actor | null, orderNumber: string, to: OrderStatus): Promise<ChangeResult> {
  assertCan(actor, "orders:manage");
  const db = await getDb();
  const result = await db.transaction(async (tx): Promise<ChangeResult> => {
    const [row] = await tx.select().from(orders).where(eq(orders.orderNumber, orderNumber)).for("update").limit(1);
    if (!row) return { ok: false, reason: "not_found" };
    if (!canTransition(row.status, to)) return { ok: false, reason: "invalid_transition" };

    await tx.update(orders).set({ status: to, updatedAt: sql`now()` }).where(eq(orders.id, row.id));
    if (to === "cancelled") await restock(tx, row.id);
    await logAction(tx, {
      actorUserId: actor.id,
      action: "order.status_changed",
      entityType: "order",
      entityId: row.orderNumber,
      metadata: { from: row.status, to },
    });
    return { ok: true };
  });
  if (result.ok && to === "cancelled") revalidateTag(CATALOG_TAG, "max");
  return result;
}

export async function changePaymentStatus(
  actor: Actor | null,
  orderNumber: string,
  to: PaymentStatus,
): Promise<ChangeResult> {
  assertCan(actor, "orders:manage");
  const db = await getDb();
  return db.transaction(async (tx): Promise<ChangeResult> => {
    const [row] = await tx.select().from(orders).where(eq(orders.orderNumber, orderNumber)).for("update").limit(1);
    if (!row) return { ok: false, reason: "not_found" };
    if (!manualPaymentTransitions[row.paymentStatus].includes(to)) return { ok: false, reason: "invalid_transition" };

    await tx.update(orders).set({ paymentStatus: to, updatedAt: sql`now()` }).where(eq(orders.id, row.id));
    await tx.update(payments).set({ status: to, updatedAt: sql`now()` }).where(eq(payments.orderId, row.id));
    await logAction(tx, {
      actorUserId: actor.id,
      action: "order.payment_changed",
      entityType: "order",
      entityId: row.orderNumber,
      metadata: { from: row.paymentStatus, to },
    });
    return { ok: true };
  });
}

export async function countOrdersByStatus(actor: Actor | null): Promise<Record<OrderStatus, number>> {
  assertCan(actor, "orders:manage");
  const db = await getDb();
  const rows = await db
    .select({ status: orders.status, count: sql<number>`count(*)::int` })
    .from(orders)
    .groupBy(orders.status);
  const counts = { pending: 0, confirmed: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0 };
  for (const row of rows) counts[row.status] = row.count;
  return counts;
}

export type StripePaymentChange = { changed: boolean; reason?: "not_found" | "not_stripe" | "invalid_transition" };

/**
 * Применяет событие Stripe к заказу. Вызывается только из webhook после проверки подписи.
 * Повтор события не меняет статус (переход уже выполнен); отказ или истечение оплаты отменяет
 * заказ и возвращает товар на склад, если заказ ещё не передан в работу.
 */
export async function applyStripePayment(
  orderNumber: string,
  to: Extract<PaymentStatus, "paid" | "failed" | "refunded">,
  eventId: string,
): Promise<StripePaymentChange> {
  const db = await getDb();
  const result = await db.transaction(async (tx): Promise<StripePaymentChange & { restocked?: boolean }> => {
    const [row] = await tx.select().from(orders).where(eq(orders.orderNumber, orderNumber)).for("update").limit(1);
    if (!row) return { changed: false, reason: "not_found" };
    if (row.paymentMethod !== "card_online") return { changed: false, reason: "not_stripe" };
    if (row.paymentStatus === to) return { changed: false };
    if (!stripePaymentTransitions[row.paymentStatus].includes(to)) return { changed: false, reason: "invalid_transition" };

    const cancel = to === "failed" && (row.status === "pending" || row.status === "confirmed");
    await tx
      .update(orders)
      .set({ paymentStatus: to, ...(cancel ? { status: "cancelled" as const } : {}), updatedAt: sql`now()` })
      .where(eq(orders.id, row.id));
    await tx.update(payments).set({ status: to, updatedAt: sql`now()` }).where(eq(payments.orderId, row.id));
    await logAction(tx, {
      actorUserId: null,
      action: "order.payment_changed",
      entityType: "order",
      entityId: row.orderNumber,
      metadata: { from: row.paymentStatus, to, source: "stripe", eventId },
    });
    if (cancel) {
      await restock(tx, row.id);
      await logAction(tx, {
        actorUserId: null,
        action: "order.status_changed",
        entityType: "order",
        entityId: row.orderNumber,
        metadata: { from: row.status, to: "cancelled", source: "stripe", eventId },
      });
    }
    return { changed: true, restocked: cancel };
  });
  if (result.restocked) revalidateTag(CATALOG_TAG, "max");
  return { changed: result.changed, reason: result.reason };
}

/** Страница результата оплаты: статус и ссылка «вернуться к оплате» — только владельцу заказа. */
export async function getPaymentStateForUser(
  orderNumber: string,
  userId: string,
): Promise<{ status: OrderStatus; paymentStatus: PaymentStatus; paymentUrl: string | null } | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, userId)))
    .limit(1);
  if (!row) return null;
  return { status: row.status, paymentStatus: row.paymentStatus, paymentUrl: await openPaymentUrl(row) };
}
