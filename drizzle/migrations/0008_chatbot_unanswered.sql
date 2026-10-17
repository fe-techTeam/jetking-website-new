CREATE TABLE "chatbot_unanswered" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"intent" text DEFAULT '' NOT NULL,
	"reason" text NOT NULL,
	"top_score" double precision,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "chatbot_unanswered_created_idx" ON "chatbot_unanswered" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chatbot_unanswered_resolved_idx" ON "chatbot_unanswered" USING btree ("resolved");