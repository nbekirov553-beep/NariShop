import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { catalogQuerySchema } from "@/features/catalog/query";
import { formToObject, productInputSchema, type ProductInput } from "@/features/admin/schema";
import { canTransition, checkoutSchema } from "@/features/orders/schema";
import { getDb } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { ForbiddenError, roleForEmail, type Actor } from "@/server/permissions";
import { listProducts } from "@/server/repositories/catalog";
import { listAuditLog } from "@/server/services/audit";
import {
  adminListCategories,
  adminListProducts,
  createProduct,
  getProductForAdmin,
  setProductActive,
  updateProduct,
} from "@/server/services/catalog-admin";
import {
  changeOrderStatus,
  changePaymentStatus,
  createOrder,
  getOrderByNumber,
  getOrderForUser,
  listOrders,
  listOrdersForUser,
} from "@/server/services/orders";

const checkout = checkoutSchema.parse({
  name: "Aziz Rahimov",
  phone: "+998 91 555-44-33",
  deliveryMethod: "pickup",
  paymentMethod: "cash",
});

const admin: Actor = { id: randomUUID(), role: "admin" };
const manager: Actor = { id: randomUUID(), role: "manager" };
const buyer: Actor = { id: randomUUID(), role: "customer" };
const stranger: Actor = { id: randomUUID(), role: "customer" };

beforeAll(async () => {
  const db = await getDb();
  await db.insert(users).values(
    [admin, manager, buyer, stranger].map((actor) => ({
      id: actor.id,
      email: `${actor.id}@example.com`,
      role: actor.role,
    })),
  );
});

async function placeOrder(productId: string, quantity: number, userId: string | null = buyer.id) {
  const result = await createOrder(randomUUID(), [{ productId, quantity }], checkout, userId);
  if (!result.ok) throw new Error(result.reason);
  return result.order.orderNumber;
}

describe("permissions", () => {
  it("grants ADMIN_EMAILS the admin role, case-insensitively", () => {
    expect(roleForEmail("Owner@Shop.uz", "owner@shop.uz, boss@shop.uz")).toBe("admin");
    expect(roleForEmail("someone@shop.uz", "owner@shop.uz")).toBeNull();
    expect(roleForEmail(null, "owner@shop.uz")).toBeNull();
  });

  it("forbids customers and guests from admin services", async () => {
    await expect(listOrders(buyer)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listOrders(null)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getProductForAdmin(manager, "p-012")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listAuditLog(manager)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("order lifecycle", () => {
  it("allows only forward transitions", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("pending", "shipped")).toBe(false);
    expect(canTransition("completed", "cancelled")).toBe(false);
  });

  it("decrements stock on order and restores it on cancel", async () => {
    const before = (await getProductForAdmin(admin, "p-012"))!.stockQuantity;
    const number = await placeOrder("p-012", 2);
    expect((await getProductForAdmin(admin, "p-012"))!.stockQuantity).toBe(before - 2);

    expect(await changeOrderStatus(manager, number, "confirmed")).toEqual({ ok: true });
    expect(await changeOrderStatus(manager, number, "completed")).toEqual({ ok: false, reason: "invalid_transition" });
    expect(await changeOrderStatus(manager, number, "cancelled")).toEqual({ ok: true });
    expect((await getProductForAdmin(admin, "p-012"))!.stockQuantity).toBe(before);

    const order = await getOrderByNumber(manager, number);
    expect(order?.status).toBe("cancelled");
    expect(await changeOrderStatus(manager, "NS-0", "confirmed")).toEqual({ ok: false, reason: "not_found" });
  });

  it("records payment changes and writes the audit log", async () => {
    const number = await placeOrder("p-012", 1);
    expect(await changePaymentStatus(manager, number, "paid")).toEqual({ ok: true });
    expect((await getOrderByNumber(manager, number))?.paymentStatus).toBe("paid");

    const log = await listAuditLog(admin);
    expect(log.items.some((entry) => entry.entityId === number && entry.action.startsWith("order.payment"))).toBe(true);
  });

  it("shows customers only their own orders", async () => {
    const number = await placeOrder("p-012", 1);
    expect((await listOrdersForUser(buyer.id)).map((order) => order.orderNumber)).toContain(number);
    expect(await listOrdersForUser(stranger.id)).toEqual([]);
    expect(await getOrderForUser(number, stranger.id)).toBeNull();
    expect((await getOrderForUser(number, buyer.id))?.items[0]).toMatchObject({ productId: "p-012", quantity: 1 });
  });

  it("filters the admin order list by status and query", async () => {
    const number = await placeOrder("p-012", 1);
    const byNumber = await listOrders(manager, { q: number });
    expect(byNumber.items.map((order) => order.orderNumber)).toEqual([number]);
    const cancelled = await listOrders(manager, { status: "cancelled" });
    expect(cancelled.items.every((order) => order.status === "cancelled")).toBe(true);
  });
});

describe("catalog admin", () => {
  const input = (): ProductInput =>
    productInputSchema.parse({
      sku: "ns-test-001",
      slug: "test-speaker",
      brand: "Testbrand",
      name: { uz: "Sinov karnay", ru: "Тестовая колонка", en: "Test speaker" },
      description: { uz: "Tavsif", ru: "Описание", en: "Description" },
      priceUzs: "450000",
      compareAtPriceUzs: "",
      stockQuantity: "7",
      warrantyMonths: "12",
      isActive: true,
      categoryIds: ["cat-audio"],
      imageUrl: "",
    });

  it("parses form data into the product schema", () => {
    const form = new FormData();
    form.append("name.ru", "Колонка");
    form.append("categoryIds", "a");
    form.append("categoryIds", "b");
    form.append("isActive", "on");
    form.append("$ACTION_ID_x", "ignored");
    expect(formToObject(form, { arrays: ["categoryIds"], booleans: ["isActive", "missing"] })).toEqual({
      name: { ru: "Колонка" },
      categoryIds: ["a", "b"],
      isActive: true,
      missing: false,
    });
  });

  it("lists products with their primary image and categories with counts", async () => {
    const list = await adminListProducts(admin, { q: "p-012", limit: 50 });
    const all = await adminListProducts(admin, { limit: 50 });
    expect(all.total).toBeGreaterThan(0);
    expect(all.items.every((product) => product.imageUrl === null || product.imageUrl.length > 0)).toBe(true);
    expect(all.items.some((product) => product.imageUrl)).toBe(true);
    expect(list.items.length).toBeLessThanOrEqual(all.items.length);

    const categories = await adminListCategories(admin);
    expect(categories.find((category) => category.id === "cat-audio")?.productCount).toBeGreaterThan(0);
  });

  it("rejects a compare-at price lower than the price", () => {
    const result = productInputSchema.safeParse({ ...input(), compareAtPriceUzs: 100 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ["compareAtPriceUzs"], message: "compareAtLow" });
  });

  it("creates, updates and archives a product visible in search", async () => {
    const created = await createProduct(admin, input());
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(await createProduct(admin, input())).toEqual({
      ok: false,
      errors: { sku: "skuTaken", slug: "slugTaken" },
    });

    const found = await listProducts(catalogQuerySchema.parse({ q: "тестовая" }));
    expect(found.items.map((product) => product.id)).toContain(created.id);

    const updated = await updateProduct(admin, created.id, { ...input(), priceUzs: 399_000, stockQuantity: 3 });
    expect(updated).toEqual({ ok: true, id: created.id });
    expect(await getProductForAdmin(admin, created.id)).toMatchObject({ priceUzs: 399_000, stockQuantity: 3 });

    expect(await setProductActive(admin, created.id, false)).toBe(true);
    const afterArchive = await listProducts(catalogQuerySchema.parse({ q: "тестовая" }));
    expect(afterArchive.items.map((product) => product.id)).not.toContain(created.id);

    const log = await listAuditLog(admin, { limit: 100 });
    const actions = log.items.filter((entry) => entry.entityId === created.id).map((entry) => entry.action);
    expect(actions).toEqual(expect.arrayContaining(["product.created", "product.updated", "product.archived"]));
    const update = log.items.find((entry) => entry.entityId === created.id && entry.action === "product.updated");
    expect(update?.metadata).toMatchObject({ priceUzs: { from: 450_000, to: 399_000 } });
  });
});
