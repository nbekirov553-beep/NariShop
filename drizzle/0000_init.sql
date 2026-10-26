CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('not_started', 'pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb NOT NULL,
	"icon" text NOT NULL,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"product_id" text,
	"sku" text NOT NULL,
	"name" jsonb NOT NULL,
	"unit_price_uzs" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total_uzs" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_number" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"user_id" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'not_started' NOT NULL,
	"currency" text DEFAULT 'UZS' NOT NULL,
	"subtotal_uzs" integer NOT NULL,
	"delivery_fee_uzs" integer DEFAULT 0 NOT NULL,
	"total_uzs" integer NOT NULL,
	"checkout" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"product_id" text NOT NULL,
	"category_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_categories_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_images_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" text NOT NULL,
	"url" text NOT NULL,
	"alt" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"slug" text NOT NULL,
	"brand" text NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb NOT NULL,
	"price_uzs" integer NOT NULL,
	"compare_at_price_uzs" integer,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"warranty_months" integer DEFAULT 12 NOT NULL,
	"specifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"popularity" integer DEFAULT 0 NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_key" ON "orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "product_categories_category_idx" ON "product_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_key" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_key" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand");--> statement-breakpoint
CREATE INDEX "products_price_idx" ON "products" USING btree ("price_uzs");