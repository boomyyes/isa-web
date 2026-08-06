/**
 * Email newly registered students their UID + access code.
 *
 *   npx tsx scripts/send-passwords.ts           # preview — sends NOTHING
 *   npx tsx scripts/send-passwords.ts --send    # actually sends
 *
 * Reads new-access-codes.csv (written by import-roster.ts) — access codes are
 * stored hashed, so that file is the only copy of the plaintext.
 *
 * NO DOUBLE-SENDING. Redis is the authority, not this file: each record carries
 * a `passwordEmailedAt` stamp, and anyone already stamped is skipped. That holds
 * even if you re-run this, run it from another machine, or still have an old
 * handout file lying around. The stamp is written after each successful send, so
 * an interrupted run resumes exactly where it stopped.
 *
 * Sending is opt-in via --send precisely because it is irreversible and goes to
 * real people. The default run prints what it *would* do.
 *
 * SMTP is configured through env vars (see .env.example), so this works with a
 * Gmail app password, your college mail server, or a transactional provider —
 * no account signup is baked in.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import nodemailer from "nodemailer";
import type { CertRecord } from "../lib/certificates";
import { redisKey } from "../lib/certificates.server";

const HANDOUT_FILE = "new-access-codes.csv";

/** Gap between messages. Most free SMTP relays throttle or blacklist on bursts. */
const SEND_DELAY_MS = 1200;

function loadEnv(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.trim().replace(/^(['"])(.*)\1$/, "$2");
  }
}

/** RFC 4180 CSV reader — handles quoted fields and "" escapes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += char;
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function buildEmail(name: string, uid: string, password: string, siteUrl: string) {
  const firstName = name.trim().split(/\s+/)[0] || "there";

  const text = [
    `Hi ${firstName},`,
    ``,
    `Your ISA-RAIT certificate account is ready. Use these details to download`,
    `your workshop certificates:`,
    ``,
    `  UID:         ${uid}`,
    `  Access code: ${password}`,
    ``,
    `Collect them here: ${siteUrl}/certificates`,
    ``,
    `The access code is not case-sensitive and the dash is optional.`,
    `Keep this email — the code cannot be recovered, only reissued.`,
    ``,
    `If you didn't attend an ISA-RAIT workshop, you can ignore this message.`,
    ``,
    `— ISA RAIT Student Chapter`,
  ].join("\n");

  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;color:#1E293B;max-width:520px">
  <p>Hi ${escapeHtml(firstName)},</p>
  <p>Your ISA-RAIT certificate account is ready. Use these details to download your workshop certificates:</p>
  <table style="border-collapse:collapse;margin:20px 0;background:#F4F7FA;border-radius:8px">
    <tr><td style="padding:10px 16px;color:#64748B">UID</td>
        <td style="padding:10px 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:16px;font-weight:600">${escapeHtml(uid)}</td></tr>
    <tr><td style="padding:10px 16px;color:#64748B">Access code</td>
        <td style="padding:10px 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:16px;font-weight:600;letter-spacing:1px">${escapeHtml(password)}</td></tr>
  </table>
  <p><a href="${escapeHtml(siteUrl)}/certificates" style="display:inline-block;background:#00A3C4;color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600">Collect your certificates</a></p>
  <p style="color:#64748B;font-size:14px">The access code is not case-sensitive and the dash is optional.<br>
  Keep this email — the code cannot be recovered, only reissued.</p>
  <p style="color:#64748B;font-size:14px">If you didn't attend an ISA-RAIT workshop, you can ignore this message.</p>
  <p style="color:#64748B;font-size:14px">— ISA RAIT Student Chapter</p>
</div>`;

  return { text, html };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = process.argv.slice(2);
  const send = args.includes("--send");
  const fileArg = args.find((a) => !a.startsWith("--"));

  loadEnv(resolve(process.cwd(), ".env.local"));

  const handoutPath = resolve(process.cwd(), fileArg ?? HANDOUT_FILE);
  if (!existsSync(handoutPath)) {
    console.error(
      `No ${fileArg ?? HANDOUT_FILE} found.\n` +
        `It is written by the import when new students are registered:\n` +
        `  npx tsx scripts/import-roster.ts roster.csv`
    );
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(handoutPath, "utf8")).filter((r) =>
    r.some((c) => c.trim() !== "")
  );
  if (rows.length < 2) {
    console.log("Handout file has no entries — nothing to send.");
    return;
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = {
    uid: header.indexOf("uid"),
    name: header.indexOf("name"),
    email: header.indexOf("email"),
    password: header.indexOf("password"),
  };
  if (Object.values(idx).some((i) => i === -1)) {
    console.error("Handout must have UID, Name, Email and Password columns. Found:", header);
    process.exit(1);
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (.env.local).");
    process.exit(1);
  }
  const redis = new Redis({ url, token });

  const siteUrl = (process.env.SITE_URL ?? "https://isarait.org").replace(/\/+$/, "");

  // --- decide who actually needs an email -----------------------------------
  type Target = { uid: string; name: string; email: string; password: string; record: CertRecord };
  const targets: Target[] = [];
  let alreadySent = 0;
  let noEmail = 0;
  let missing = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const uid = (row[idx.uid] ?? "").trim();
    const email = (row[idx.email] ?? "").trim();
    const password = (row[idx.password] ?? "").trim();
    const name = (row[idx.name] ?? "").trim();
    if (!uid || !password) continue;

    if (!email || !email.includes("@")) {
      console.warn(`  ! UID ${uid} (${name || "unnamed"}) has no email — hand the code over in person`);
      noEmail++;
      continue;
    }

    const record = await redis.get<CertRecord>(redisKey(uid));
    if (!record) {
      console.warn(`  ! UID ${uid} is no longer in the roster — skipped`);
      missing++;
      continue;
    }
    // The authoritative guard. Nobody stamped gets a second email.
    if (record.passwordEmailedAt) {
      alreadySent++;
      continue;
    }

    targets.push({ uid, name, email, password, record });
  }

  console.log(
    `\n${rows.length - 1} entr(ies) in the handout: ` +
      `${targets.length} to email, ${alreadySent} already sent, ` +
      `${noEmail} without an address, ${missing} no longer on the roster.`
  );

  if (targets.length === 0) {
    console.log("\nNothing to do.");
    return;
  }

  if (!send) {
    console.log("\nPREVIEW — no email will be sent. These would receive one:\n");
    for (const t of targets) {
      console.log(`  UID ${t.uid.padEnd(6)} ${t.email.padEnd(32)} ${t.name}`);
    }
    console.log(`\nSite link in the email: ${siteUrl}/certificates`);
    console.log("\nRe-run with --send to actually deliver these.");
    return;
  }

  // --- send -----------------------------------------------------------------
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM;
  if (!host || !user || !pass || !from) {
    console.error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and\n" +
        "MAIL_FROM in .env.local — see .env.example."
    );
    process.exit(1);
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 is implicit TLS; 587 upgrades via STARTTLS
    auth: { user, pass },
  });

  try {
    await transport.verify();
    console.log(`\nSMTP connection to ${host}:${port} OK. Sending ${targets.length} email(s)...\n`);
  } catch (error) {
    console.error(`\nSMTP connection failed — ${(error as Error).message}`);
    process.exit(1);
  }

  let sent = 0;
  let failed = 0;

  for (const t of targets) {
    const { text, html } = buildEmail(t.name, t.uid, t.password, siteUrl);
    try {
      await transport.sendMail({
        from,
        to: t.email,
        subject: "Your ISA-RAIT certificate access code",
        text,
        html,
      });

      // Stamp immediately after each success, so an interrupted run never
      // re-sends what it already delivered.
      await redis.set(redisKey(t.uid), {
        ...t.record,
        passwordEmailedAt: new Date().toISOString(),
      } satisfies CertRecord);

      sent++;
      console.log(`  sent  UID ${t.uid.padEnd(6)} ${t.email}`);
    } catch (error) {
      failed++;
      console.error(`  FAIL  UID ${t.uid.padEnd(6)} ${t.email} — ${(error as Error).message}`);
    }

    await sleep(SEND_DELAY_MS);
  }

  transport.close();

  console.log(`\nDone — ${sent} sent, ${failed} failed.`);
  if (failed > 0) {
    console.log("Failed addresses were NOT stamped; re-running will retry only those.");
  }
  if (sent > 0) {
    console.log(`\nDelete ${HANDOUT_FILE} now — it holds plaintext access codes.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
