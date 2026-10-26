import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { CheckoutData } from "@/features/orders/schema";
import type { Localized } from "@/lib/i18n/config";
import type { CategoryIcon, DemoProduct } from "@/server/demo/catalog-data";

// Схема БД магазина (Spec §4). Деньги — целые суммы в UZS, локализованные тексты — jsonb { uz, ru, en }.
// Таблицы users/accounts/sessions/verification_tokens — в формате Drizzle-адаптера Auth.js.

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const userRole = pgEnum("user_role", ["customer", "manager", "admin"]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),
  /** Роль назначает только сервер; новая регистрация всегда customer. */
  role: userRole("role").notNull().default("customer"),
  preferredLocale: text("preferred_locale"),
  /** Профиль покупателя; `name` собирается из имени и фамилии для шапки и журнала. */
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  birthDate: date("birth_date"),
  city: text("city"),
  address: text("address"),
  ...timestamps,
});

/** Загруженное фото профиля (256×256, base64). Отдаётся через `/api/v1/avatars/[userId]`. */
export const userAvatars = pgTable("user_avatars", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  data: text("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<"oauth" | "oidc" | "email" | "webauthn">().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("accounts_user_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    parentId: text("parent_id"),
    slug: text("slug").notNull(),
    name: jsonb("name").$type<Localized>().notNull(),
    description: jsonb("description").$type<Localized>().notNull(),
    icon: text("icon").$type<CategoryIcon>().notNull(),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("categories_slug_key").on(table.slug)],
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    sku: text("sku").notNull(),
    slug: text("slug").notNull(),
    brand: text("brand").notNull(),
    name: jsonb("name").$type<Localized>().notNull(),
    description: jsonb("description").$type<Localized>().notNull(),
    priceUzs: integer("price_uzs").notNull(),
    compareAtPriceUzs: integer("compare_at_price_uzs"),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    warrantyMonths: integer("warranty_months").notNull().default(12),
    specifications: jsonb("specifications").$type<DemoProduct["specifications"]>().notNull().default([]),
    popularity: integer("popularity").notNull().default(0),
    /** Бренд, SKU, названия товара и категорий на всех языках в нижнем регистре — для поиска. */
    searchText: text("search_text").notNull().default(""),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_sku_key").on(table.sku),
    uniqueIndex("products_slug_key").on(table.slug),
    index("products_brand_idx").on(table.brand),
    index("products_price_idx").on(table.priceUzs),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: jsonb("alt").$type<Localized>().notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (table) => [index("product_images_product_idx").on(table.productId)],
);

export const productCategories = pgTable(
  "product_categories",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index("product_categories_category_idx").on(table.categoryId),
  ],
);

export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
]);

export const paymentStatus = pgEnum("payment_status", ["not_started", "pending", "paid", "failed", "refunded"]);

export const orderNumberSeq = pgSequence("order_number_seq", { startWith: 100001 });

export const orders = pgTable(
  "orders",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderNumber: text("order_number")
      .notNull()
      .default(sql`'NS-' || nextval('order_number_seq')`),
    idempotencyKey: text("idempotency_key").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    status: orderStatus("status").notNull().default("pending"),
    paymentStatus: paymentStatus("payment_status").notNull().default("not_started"),
    paymentMethod: text("payment_method").$type<CheckoutData["paymentMethod"]>().notNull(),
    deliveryMethod: text("delivery_method").$type<CheckoutData["deliveryMethod"]>().notNull(),
    currency: text("currency").notNull().default("UZS"),
    subtotalUzs: integer("subtotal_uzs").notNull(),
    deliveryFeeUzs: integer("delivery_fee_uzs").notNull().default(0),
    totalUzs: integer("total_uzs").notNull(),
    /** Снимок контактов, адреса и способа получения на момент заказа. */
    checkout: jsonb("checkout").$type<CheckoutData>().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("orders_order_number_key").on(table.orderNumber),
    uniqueIndex("orders_idempotency_key").on(table.idempotencyKey),
    index("orders_user_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    sku: text("sku").notNull(),
    name: jsonb("name").$type<Localized>().notNull(),
    unitPriceUzs: integer("unit_price_uzs").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalUzs: integer("line_total_uzs").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

/** Платёж по заказу через адаптер провайдера (manual — оплата при получении). Реквизиты карт не хранятся. */
export const payments = pgTable(
  "payments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerPaymentId: text("provider_payment_id"),
    status: paymentStatus("status").notNull().default("not_started"),
    amountUzs: integer("amount_uzs").notNull(),
    currency: text("currency").notNull().default("UZS"),
    idempotencyKey: text("idempotency_key").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("payments_idempotency_key").on(table.idempotencyKey),
    index("payments_order_idx").on(table.orderId),
  ],
);

/** Журнал действий персонала: кто, что и когда изменил. metadata — без секретов и лишних персональных данных. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
    index("audit_log_created_idx").on(table.createdAt),
  ],
);
