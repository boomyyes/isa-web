CREATE TABLE "notice_acks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"version" text NOT NULL,
	"acked_at" timestamp with time zone DEFAULT now() NOT NULL
);
