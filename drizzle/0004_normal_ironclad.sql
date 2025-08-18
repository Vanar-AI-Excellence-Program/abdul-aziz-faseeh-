CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
DROP INDEX "chat_messages_session_id_idx";--> statement-breakpoint
DROP INDEX "chat_messages_timestamp_idx";--> statement-breakpoint
DROP INDEX "chat_sessions_user_id_idx";--> statement-breakpoint
DROP INDEX "chat_sessions_created_at_idx";--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "role" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "timestamp" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "title" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "parent_message_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "order_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_session_idx" ON "chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "chat_messages_parent_idx" ON "chat_messages" USING btree ("parent_message_id");--> statement-breakpoint
CREATE INDEX "chat_messages_order_idx" ON "chat_messages" USING btree ("session_id","order_index");