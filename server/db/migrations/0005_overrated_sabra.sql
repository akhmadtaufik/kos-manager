CREATE TABLE IF NOT EXISTS "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"recorded_by" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_properties" ALTER COLUMN "permissions" SET DEFAULT '["rooms:read","rooms:create","rooms:update","rooms:delete","tenants:read","tenants:create","tenants:update","tenants:delete","payments:read","payments:create","payments:update","payments:delete","expenses:read","expenses:create","expenses:update","expenses:delete","reports:read"]'::jsonb;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "amount_paid" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "emergency_contact" varchar(255);--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_transactions_payment_id_payments_id_fk'
  ) THEN
    ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_transactions_recorded_by_users_id_fk'
  ) THEN
    ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_transactions_payment_id_idx" ON "payment_transactions" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_transactions_payment_date_idx" ON "payment_transactions" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_transactions_recorded_by_idx" ON "payment_transactions" USING btree ("recorded_by");