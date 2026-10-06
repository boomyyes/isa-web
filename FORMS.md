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

Owners: **Admin area → Erasure**. Enter the address twice. It deletes every
submission made with that address from Upstash, and the next sheet sync deletes
the matching rows. Confirm the request came from that person first. Rows from
the old Tally and Google forms are not covered: delete those by hand.

---

## Admin area

**Where:** `https://admin.isarait.in` on the live site. Off production
(previews, `isa-web-six.vercel.app`, localhost) it is also at `/admin`. On the
live www site, `/admin` returns 404.

The subdomain is not a secret. Every HTTPS certificate is published in public
logs, so assume people can find it. The sign-in is what protects it.

**Signing in:** enter your email and you get a link that works once and
expires in 10 minutes. Opening the link shows a *Sign in* button, so mail
scanners that open links can't use it up. Sessions last 8 hours. Removing an
admin signs them out at once.

**Roles**

| Role | Can |
|---|---|
| Viewer | Read the inbox and submissions |
| Editor | Also change status and add notes (both appear in the sheet) |
| Owner | Also add and remove admins, handle erasure, read the audit log |

Admins are stored in Upstash and managed on the **Team** page, so there is no
limit and no redeploy when the committee changes. Owners listed in
`ADMIN_OWNERS` always exist and can't be changed from the Team page. That way a
mistake on the page can't lock everyone out. Keep one or two there.

**Audit log:** every sign-in, status change, note, team change and erasure,
kept for one year.

### Admin environment variables

| Variable | Value |
|---|---|
| `ADMIN_OWNERS` | Comma-separated owner emails, e.g. `a@x.com,b@y.com` |
| `ADMIN_SMTP_USER` | `isarait.forms@gmail.com` |
| `ADMIN_SMTP_PASS` | A Gmail app password for that account (below) |

Sign-in emails come from isarait.forms@gmail.com, never from the account that
sends certificate mail.

**Gmail app password:** signed in as isarait.forms@gmail.com, turn on 2-Step
Verification (Google Account → Security), then open
<https://myaccount.google.com/apppasswords>, create one named "ISA admin", and
paste the 16 characters (without spaces) into `ADMIN_SMTP_PASS`.

### Sheet columns

Each tab now has *Status* and *Notes* columns. The script updates a row in
place when an editor changes it. If a tab was created before these columns
existed, delete that tab once. The next sync rebuilds it from submissions still
waiting, but not from ones already acknowledged, so only do this with test data.
