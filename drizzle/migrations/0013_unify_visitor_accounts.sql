-- One visitor account for the website and /chatbot.
-- Merge chat_users into users (keep chat_users.id when the email is new so
-- existing chat_conversations keep working), remount conversations onto users,
-- then drop chat_users.

INSERT INTO "users" ("id", "name", "email", "phone", "state", "city", "centre", "password_hash", "created_at")
SELECT "id", "name", "email", "phone", "state", "city", "centre", "password_hash", "created_at"
FROM "chat_users"
ON CONFLICT ("email") DO NOTHING;
--> statement-breakpoint

-- Conversations whose owner was skipped above (email already in users) move to the existing users row.
UPDATE "chat_conversations" AS c
SET "user_id" = u."id"
FROM "chat_users" AS cu
INNER JOIN "users" AS u ON lower(u."email") = lower(cu."email")
WHERE c."user_id" = cu."id"
  AND c."user_id" <> u."id";
--> statement-breakpoint

ALTER TABLE "chat_conversations" DROP CONSTRAINT IF EXISTS "chat_conversations_user_id_chat_users_id_fk";
--> statement-breakpoint

ALTER TABLE "chat_conversations"
  ADD CONSTRAINT "chat_conversations_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

DROP TABLE IF EXISTS "chat_users";
