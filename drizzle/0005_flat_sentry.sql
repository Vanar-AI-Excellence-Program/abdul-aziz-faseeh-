ALTER TABLE "verification_token" DROP CONSTRAINT "verification_token_token_unique";--> statement-breakpoint
DROP INDEX "chat_messages_session_idx";--> statement-breakpoint
DROP INDEX "chat_messages_parent_idx";--> statement-breakpoint
DROP INDEX "chat_messages_order_idx";--> statement-breakpoint
DROP INDEX "email_idx";--> statement-breakpoint
DROP INDEX "verification_token_compound_key";--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_provider_provider_account_id_pk";--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "role" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "title" SET DEFAULT 'New Chat';--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "admin_approved" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "admin_approved" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_code" varchar(6);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_email_verified" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_token" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_token" DROP COLUMN "expires";