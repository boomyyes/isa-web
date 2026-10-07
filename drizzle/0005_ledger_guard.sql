-- The ledger is append-only, enforced here rather than trusted to the app.
-- UPDATE and DELETE are rejected unless the transaction has first run
--   select set_config('app.ledger_purge', 'on', true);
-- which only the owner-confirmed financial-year purge does (lib/admin/finance.ts).

ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_kind_check" CHECK ("kind" IN ('income', 'expense'));--> statement-breakpoint
-- Ordinary entries are positive; only a reversal is negative, and it must point at what it reverses.
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_amount_check" CHECK (
  ("reverses_id" IS NULL AND "amount_paise" > 0) OR ("reverses_id" IS NOT NULL AND "amount_paise" < 0)
);--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_reverses_fk"
  FOREIGN KEY ("reverses_id") REFERENCES "ledger_entries"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_amount_check" CHECK ("amount_paise" > 0);--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_status_check" CHECK ("status" IN ('submitted', 'approved', 'rejected', 'paid'));--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_allocated_check" CHECK ("allocated_paise" >= 0);--> statement-breakpoint

CREATE OR REPLACE FUNCTION ledger_append_only() RETURNS trigger AS $$
BEGIN
  IF coalesce(current_setting('app.ledger_purge', true), '') = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  RAISE EXCEPTION 'ledger_entries is append-only: % is not allowed (post a reversing entry instead)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE TRIGGER ledger_entries_append_only
  BEFORE UPDATE OR DELETE ON "ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION ledger_append_only();
