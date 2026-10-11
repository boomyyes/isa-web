CREATE TABLE "treasury_years" (
	"fy" integer PRIMARY KEY NOT NULL,
	"amount_paise" bigint NOT NULL,
	"set_by" text NOT NULL,
	"set_at" timestamp with time zone DEFAULT now() NOT NULL
);
