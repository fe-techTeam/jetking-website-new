ALTER TABLE "leads" ADD COLUMN "assigned_to" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "follow_up_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "leads_follow_up_idx" ON "leads" USING btree ("follow_up_at");