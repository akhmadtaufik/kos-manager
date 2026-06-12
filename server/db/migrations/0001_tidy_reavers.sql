ALTER TYPE "public"."user_role" ADD VALUE 'owner' BEFORE 'operator';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'pending';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "additional_fees" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_properties" ADD COLUMN "permissions" jsonb DEFAULT '["manage_rooms","manage_tenants","manage_payments","manage_expenses","view_reports"]'::jsonb;