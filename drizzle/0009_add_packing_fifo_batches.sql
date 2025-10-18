-- Create box inventory batches table for FIFO tracking
CREATE TABLE IF NOT EXISTS "box_inventory_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"box_type_id" integer NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"purchase_price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"remaining_quantity" integer NOT NULL,
	"purchase_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create packing material batches table for FIFO tracking
CREATE TABLE IF NOT EXISTS "packing_material_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"purchase_amount" numeric(10, 2) NOT NULL,
	"remaining_amount" numeric(10, 2) NOT NULL,
	"purchase_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "box_inventory_batches" ADD CONSTRAINT "box_inventory_batches_box_type_id_box_types_id_fk" FOREIGN KEY ("box_type_id") REFERENCES "public"."box_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "packing_material_batches" ADD CONSTRAINT "packing_material_batches_material_id_packing_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."packing_materials"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
