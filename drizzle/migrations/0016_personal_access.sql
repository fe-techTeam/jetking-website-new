ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "personal_access" jsonb;
--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "personal_lead_scope" text;
