# Forms — Setup and Operations

The site's forms are built in. Submissions are stored in Upstash (the same
database as certificates) and copied into a Google Sheet every five minutes,
which is where the committee reads them.

```
browser ──POST /api/forms/<form>──▶ checks ──▶ Upstash (expires after retention)
                                                   │
          Google Sheet ◀── Apps Script, every 5 min ┘  (pulls, then acknowledges)
```

The sheet belongs to **isarait.forms@gmail.com**. The site never holds Google
credentials: the sheet pulls from the site with a shared secret, the same way
the certificate roster pushes to it.

Live forms: **Query** (`/help`). Artemis registration and membership still
use their old external forms until they are migrated.

---

## One-time setup

### 1. Generate the secret

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### 2. Vercel environment variables

| Variable | Value | Without it |
|---|---|---|
| `FORMS_SYNC_SECRET` | The string from step 1 | The sheet can't pull (`401`); submissions wait in Upstash |
| `FORMS_NOTIFY_TO` | Optional. Address that gets a one-line "new submission" ping | No ping; nothing else changes |

Add both to `.env.local` too if you test locally. Redeploy after adding them.

The ping deliberately contains only the reference, never the person's details,
because mail can't be made to expire.

### 3. The sheet

Signed in as **isarait.forms@gmail.com**:

1. Create a blank Google Sheet named *ISA-RAIT Form Submissions*.
2. **Extensions → Apps Script.** Replace the contents of `Code.gs` with
   [`scripts/forms-sheet.gs`](scripts/forms-sheet.gs) and save.
3. **Project Settings → Script properties**, add:
   - `SYNC_URL` = `https://www.isarait.in/api/forms/export`
   - `SYNC_SECRET` = the same string as `FORMS_SYNC_SECRET`
4. **Triggers** (clock icon) → Add trigger, twice:
   - `pullSubmissions`, time-driven, minutes timer, every 5 minutes
   - `purgeExpired`, time-driven, day timer
5. Run `pullSubmissions` once by hand and approve the permission prompt. Tabs
   are created on first use, with a header row.
6. **Share** the sheet only with the named committee members who handle
   queries, as Viewer or Editor. Never "anyone with the link".

---

## What protects the forms

Checks run in this order. The first three return a fake success, so bots get no
signal about what caught them.

| Check | Catches |
|---|---|
| Same-origin `Origin` header | Other sites posting to the API |
| 16 KB body cap | Oversized junk |
| Hidden honeypot field | Bots that fill every input |
| Under 3 seconds since the page loaded | Scripted submissions |
| Validation (shared with the browser) | Bad or missing fields, consent and 18+ unticked |
| 10 per hour per IP, 3 per day per email per form | Flooding |
| More than 2 links, HTML or BBCode, mostly non-letters | Link spam |
| Email domain doesn't exist or has a null MX | Typos like `gmial.com`, fake domains |
| Same content from the same email within 24 hours | Double-clicks (returns the original reference) |

No confirmation email is sent to the person who submitted. A form that mails
any address it's given can be used to mail-bomb strangers.

Cells that would start with `=`, `+`, `-` or `@` get a leading `'`, and the
script writes cells as plain text, so a submitted formula can't run in the sheet.

## Retention

Each submission expires from Upstash on its own (queries: one year). The sheet
copy carries a *Delete after* column, and `purgeExpired` removes rows past it
daily. Both match section 9 of the privacy policy. Change them together.

## Erasure requests

Until the admin area exists: delete the person's rows in the sheet, and in the
Upstash console delete the matching `sub:<ref>` keys.
