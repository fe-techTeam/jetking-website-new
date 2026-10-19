CREATE TABLE "centres" (
	"slug" text PRIMARY KEY NOT NULL,
	"city_slug" text NOT NULL,
	"name" text NOT NULL,
	"address_line" text NOT NULL,
	"locality" text NOT NULL,
	"state" text NOT NULL,
	"pincode" text NOT NULL,
	"phone" text,
	"email" text,
	"helpline" text,
	"lat" double precision,
	"lng" double precision,
	"courses_offered" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"seo" jsonb NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"intro" text NOT NULL,
	"seo" jsonb NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "centres_city_slug_idx" ON "centres" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "centres_status_idx" ON "centres" USING btree ("status");