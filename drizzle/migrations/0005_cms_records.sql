CREATE TABLE "cms_records" (
	"collection" text NOT NULL,
	"record_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_records_collection_record_id_pk" PRIMARY KEY("collection","record_id")
);
--> statement-breakpoint
CREATE TABLE "cms_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection" text NOT NULL,
	"record_id" text NOT NULL,
	"action" text NOT NULL,
	"data" jsonb NOT NULL,
	"actor_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_seeded" (
	"collection" text PRIMARY KEY NOT NULL,
	"seeded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"data" "bytea" NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cms_records_collection_idx" ON "cms_records" USING btree ("collection","position");--> statement-breakpoint
CREATE INDEX "cms_revisions_record_idx" ON "cms_revisions" USING btree ("collection","record_id","created_at");--> statement-breakpoint
CREATE INDEX "media_assets_created_idx" ON "media_assets" USING btree ("created_at");