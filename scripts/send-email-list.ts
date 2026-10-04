/**
 * Email a list of people a message you've written yourself.
 *
 *   npx tsx scripts/send-email-list.ts recipients.txt --subject "..." --body message.txt           # preview
 *   npx tsx scripts/send-email-list.ts recipients.txt --subject "..." --body message.txt --send
 *
 * recipients.txt holds UIDs and/or email addresses — one per line, or separated by
 * commas or spaces. Blank lines and lines starting with # are ignored. UIDs are
 * looked up on the roster for their address and name; bare addresses are sent to
 * as-is. Each address gets one email even if it's listed twice.
 *
 * The body is a plain-text file — blank lines split paragraphs, and {name},
 * {firstName} and {uid} are filled in per recipient. The sign-off is added for you.
 *
 * Sends one at a time and carries on past failures; the ones that failed are
 * printed at the end so you can put them in a new list and re-run.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import type { CertRecord } from "../lib/certificates";
import { redisKey } from "../lib/certificates.server";
import { mailer, mailerConfigured, personalize, sendCustomEmail } from "../lib/mailer";

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

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

interface Recipient {
  /** What was written in the list — shown when it fails. */
  entry: string;
  to: string;
  name: string;
  uid: string;
}

async function main() {
  const args = process.argv.slice(2);
  const send = args.includes("--send");
  const subject = flag(args, "--subject");
  const bodyFile = flag(args, "--body");
  const listFile = args.find(
    (a, i) => !a.startsWith("--") && args[i - 1] !== "--subject" && args[i - 1] !== "--body"
  );

  if (!listFile || !subject || !bodyFile) {
    console.error(
      "Usage: npx tsx scripts/send-email-list.ts <recipients.txt> " +
        '--subject "<subject>" --body <file.txt> [--send]'
    );
    process.exit(1);
  }
  for (const file of [listFile, bodyFile]) {
    if (!existsSync(file)) {
      console.error(`File not found: ${file}`);
      process.exit(1);
    }
  }
  const template = readFileSync(bodyFile, "utf8");
  if (!template.trim()) {
    console.error(`Body file is empty: ${bodyFile}`);
    process.exit(1);
  }

  const entries = readFileSync(listFile, "utf8")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("#"))
    .flatMap((line) => line.split(/[\s,;]+/))
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    console.error(`No recipients in ${listFile}.`);
    process.exit(1);
  }

  loadEnv(resolve(process.cwd(), ".env.local"));

  let redis: Redis | null = null;
  if (entries.some((entry) => !entry.includes("@"))) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      console.error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (.env.local).");
      process.exit(1);
    }
    redis = new Redis({ url, token });
  }

  const recipients: Recipient[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    let recipient: Recipient;
    if (entry.includes("@")) {
      recipient = { entry, to: entry, name: "", uid: "" };
    } else {
      const record = await redis!.get<CertRecord>(redisKey(entry));
      if (!record) {
        skipped.push(`${entry} — not on the roster`);
        continue;
      }
      if (!record.email) {
        skipped.push(`${entry} — ${record.name} has no email address`);
        continue;
      }
      recipient = { entry, to: record.email, name: record.name, uid: String(record.uid) };
    }

    const key = recipient.to.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push(recipient);
  }

  console.log(`${recipients.length} recipient(s):\n`);
  for (const r of recipients) {
    console.log(`  ${r.to.padEnd(36)} ${r.name}${r.uid ? ` (UID ${r.uid})` : ""}`);
  }
  if (skipped.length > 0) {
    console.log(`\nSkipped ${skipped.length}:`);
    for (const line of skipped) console.log(`  ${line}`);
  }

  if (recipients.length === 0) {
    console.error("\nNobody to send to.");
    process.exitCode = 1;
    return;
  }

  // Shown as the first recipient will get it, so placeholders can be checked.
  const sample = recipients[0];
  console.log(`\n--- Preview for ${sample.to} ---`);
  console.log(`Subject: ${personalize(subject, sample)}`);
  console.log(`\n${personalize(template, sample).trim()}\n\n— ISA RAIT Student Chapter`);
  console.log("---");

  if (!send) {
    console.log("\nPREVIEW — nothing sent. Re-run with --send to deliver.");
    return;
  }

  if (!mailerConfigured()) {
    console.error(
      "\nSMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and\n" +
        "MAIL_FROM in .env.local — see .env.example."
    );
    process.exitCode = 1;
    return;
  }

  console.log("\nSending...\n");
  const failed: Recipient[] = [];

  try {
    for (const r of recipients) {
      try {
        await sendCustomEmail({
          to: r.to,
          subject: personalize(subject, r),
          body: personalize(template, r),
        });
        console.log(`  sent    ${r.to}`);
      } catch (error) {
        console.log(`  FAILED  ${r.to} — ${(error as Error).message}`);
        failed.push(r);
      }
    }
  } finally {
    mailer().close();
  }

  console.log(`\nDone — ${recipients.length - failed.length} sent, ${failed.length} failed.`);
  if (failed.length > 0) {
    console.log("\nTo retry just the failures, put these in a new list:\n");
    for (const r of failed) console.log(r.entry);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
