ALTER TABLE "products" ADD COLUMN "handle" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_handle_unique" UNIQUE("handle");