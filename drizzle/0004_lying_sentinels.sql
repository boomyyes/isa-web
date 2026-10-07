CREATE TABLE "bill_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"r2_key" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" uuid NOT NULL,
	"amount_paise" bigint NOT NULL,
	"bill_date" date NOT NULL,
	"vendor" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"submitted_by" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"reject_reason" text,
	"paid_by" text,
	"paid_at" timestamp with time zone,
	"paid_to" text,
	"pay_mode" text
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"allocated_paise" bigint DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"amount_paise" bigint NOT NULL,
	"entry_date" date NOT NULL,
	"description" text NOT NULL,
	"bill_id" uuid,
	"reverses_id" uuid,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_reverses_id_unique" UNIQUE("reverses_id")
);
--> statement-breakpoint
ALTER TABLE "bill_receipts" ADD CONSTRAINT "bill_receipts_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bills_budget_idx" ON "bills" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "bills_status_idx" ON "bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bills_date_idx" ON "bills" USING btree ("bill_date");--> statement-breakpoint
CREATE INDEX "ledger_budget_idx" ON "ledger_entries" USING btree ("budget_id","entry_date");--> statement-breakpoint
CREATE INDEX "ledger_date_idx" ON "ledger_entries" USING btree ("entry_date");