ALTER TABLE "tenants" ADD COLUMN "district_id" varchar(10);--> statement-breakpoint
CREATE INDEX "tenants_district_id_idx" ON "tenants" USING btree ("district_id");