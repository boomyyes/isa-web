ALTER TABLE "chat_channels" ADD COLUMN "domain" text;--> statement-breakpoint
ALTER TABLE "forum_categories" ADD COLUMN "domain" text;--> statement-breakpoint
UPDATE "forum_categories" SET "domain" = lower("name") WHERE lower("name") IN ('administrative', 'creative', 'editorial', 'media', 'publicity', 'technical');--> statement-breakpoint
UPDATE "chat_channels" SET "domain" = lower("name") WHERE lower("name") IN ('administrative', 'creative', 'editorial', 'media', 'publicity', 'technical');
