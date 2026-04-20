ALTER TABLE "appointments" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "booking_reference" text NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_booking_reference_unique" UNIQUE("booking_reference");