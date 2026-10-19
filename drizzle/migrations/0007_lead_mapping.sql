ALTER TABLE "leads" ADD COLUMN "form" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "centre_slug" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "centre_name" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "course_slug" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "qualification" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "message" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "visitor_id" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "account_id" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "journey_stage" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "intent" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_medium" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_campaign" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_content" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "landing_page" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "crm_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
CREATE INDEX "leads_phone_idx" ON "leads" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "leads_centre_idx" ON "leads" USING btree ("centre_slug");