/**
 * Resend access codes to a list of students.
 *
 *   npx tsx scripts/resend-passwords.ts uids.txt           # preview — changes nothing
 *   npx tsx scripts/resend-passwords.ts uids.txt --send
 *
 * uids.txt holds UIDs — one per line, or separated by commas or spaces. Blank
 * lines and lines starting with # are ignored.
 *
 * Codes are stored hashed, so old ones can't be recovered: each student is
 * emailed a fresh random code that replaces their old one, including any code
 * they chose themselves.
 *
 * Sends one at a time and carries on past failures. A failed student keeps their
 * old code; their UIDs are printed at the end so you can re-run with just those.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import type { CertRecord } from "../lib/certificates";
import { redisKey } from "../lib/certificates.server";
import { mailer, mailerConfigured } from "../lib/mailer";
import { resendAccessCode } from "../lib/roster";

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

async function main() {
  const args = process.argv.slice(2);
  const send = args.includes("--send");
  const listFile = args.find((a) => !a.startsWith("--"));

  if (!listFile) {
    console.error("Usage: npx tsx scripts/resend-passwords.ts <uids.txt> [--send]");
    process.exit(1);
  }
  if (!existsSync(listFile)) {
    console.error(`File not found: ${listFile}`);
    process.exit(1);
  }

  const uids = [
    ...new Set(
      readFileSync(listFile, "utf8")
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("#"))
        .flatMap((line) => line.split(/[\s,;]+/))
        .map((uid) => uid.trim())
        .filter(Boolean)
    ),
  ];
  if (uids.length === 0) {
    console.error(`No UIDs in ${listFile}.`);
    process.exit(1);
  }

  loadEnv(resolve(process.cwd(), ".env.local"));
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (.env.local).");
    process.exit(1);
  }
  const redis = new Redis({ url, token });

  const records: CertRecord[] = [];
  const skipped: string[] = [];

  for (const uid of uids) {
    const record = await redis.get<CertRecord>(redisKey(uid));
    if (!record) {
      skipped.push(`${uid} — not on the roster`);
    } else if (!record.email) {
      skipped.push(`${uid} — ${record.name} has no email address`);
    } else {
      records.push(record);
    }
  }

  console.log(`${records.length} student(s) will get a new code:\n`);
  for (const r of records) {
    console.log(`  UID ${String(r.uid).padEnd(6)} ${r.email.padEnd(36)} ${r.name}`);
  }
  if (skipped.length > 0) {
    console.log(`\nSkipped ${skipped.length}:`);
    for (const line of skipped) console.log(`  ${line}`);
  }

  if (records.length === 0) {
    console.error("\nNobody to send to.");
    process.exitCode = 1;
    return;
  }

  if (!send) {
    console.log("\nPREVIEW — nothing changed. Re-run with --send to issue and email new codes.");
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
  const failed: string[] = [];

  try {
    for (const r of records) {
      try {
        await resendAccessCode(redis, r);
        console.log(`  sent    UID ${r.uid} → ${r.email}`);
      } catch (error) {
        console.log(`  FAILED  UID ${r.uid} → ${r.email} — ${(error as Error).message}`);
        failed.push(String(r.uid));
      }
    }
  } finally {
    mailer().close();
  }

  console.log(`\nDone — ${records.length - failed.length} sent, ${failed.length} failed.`);
  if (failed.length > 0) {
    console.log("Failed students kept their old code. To retry just them, put these in a new list:\n");
    for (const uid of failed) console.log(uid);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
