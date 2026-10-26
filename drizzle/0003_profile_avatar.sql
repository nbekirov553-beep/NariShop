CREATE TABLE "user_avatars" (
	"user_id" text PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"data" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;