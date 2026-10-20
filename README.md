# ISA-RAIT website

The website of the ISA Student Chapter at RAIT: the public site, and the committee's admin workspace (`admin.isarait.in`).

**Stack:** Next.js 16 (App Router) on Vercel, React 19, Tailwind CSS 4, TypeScript (strict). Data lives in Neon Postgres (via Drizzle), Upstash Redis and Cloudflare R2. Mail goes out over SMTP, live updates go through Ably, and errors are reported to Sentry.

## Getting started

```bash
npm i
cp .env.example .env.local   # then fill it in: every variable is explained there
npm run dev                  # http://localhost:3000
```

Most of the public site runs with no variables set. The admin area needs at least `UPSTASH_REDIS_REST_*`, `DATABASE_URL`, `ADMIN_OWNERS` and the `SMTP_*` sign-in mail. After setting `DATABASE_URL` for the first time, run `npm run db:migrate`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run lint` | ESLint. Keep it at zero problems. |
| `npm test` | Unit tests (`lib/**/*.test.ts`) |
| `npm run build` | Production build. Checks the content files first (`scripts/check-content.ts`). |
| `npm run db:generate` | New migration from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations in `drizzle/` |

## Where things live

| Path | Contents |
|---|---|
| `app/(site)/` | Public pages |
| `app/admin/` | Admin workspace: `(workspace)/` holds the pages inside the sidebar, `login/` is outside it |
| `app/api/` | Route handlers (forms, certificates, admin actions, cron) |
| `components/` | UI, by area (`admin/`, `sections/`, `layout/`, `ui/`, …) |
| `lib/` | Server logic: database, Redis, mail, auth, forms, finance |
| `content/site/` | Site content as JSON, edited from the admin Content page |
| `drizzle/` | Database migrations |
| `scripts/` | One-off tools: roster import, password and email sends. Run with `npx tsx scripts/<name>.ts`. Anything that sends mail only previews until you add `--send`. |

## Operations

- The forms pipeline and its Google Sheet sync are described in [FORMS.md](FORMS.md).
- The other step-by-step operator guides (deployment and setup, certificates, adding a workshop) are kept privately by the committee, outside this repository. Ask the current web lead for them.
- Errors from pages and routes go to Sentry when `SENTRY_DSN` is set. The "Ref" on an error page is the event's `digest` tag there.
- Production deploys from `main` on Vercel (region `bom1`).
