/**
 * Resend one student their access code.
 *
 *   npx tsx scripts/resend-password.ts <uid>           # preview — changes nothing
 *   npx tsx scripts/resend-password.ts <uid> --send
 *
 * Codes are stored hashed, so the old one can't be recovered: this emails a
 * fresh random code and replaces the old one, which stops working. Any code the
 * student chose for themselves is replaced too.
 *
 * To set a particular code instead, use set-password.ts. For many students at
 * once, use resend-passwords.ts.
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
  const uid = args.find((a) => !a.startsWith("--"));

  if (!uid) {
    console.error("Usage: npx tsx scripts/resend-password.ts <uid> [--send]");
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
  const record = await redis.get<CertRecord>(redisKey(uid));
  if (!record) {
    console.error(`UID ${uid} is not on the roster.`);
    process.exitCode = 1;
    return;
  }
  if (!record.email) {
    console.error(
      `UID ${uid} (${record.name}) has no email address. Add it to the sheet and re-sync,\n` +
        "or set a code with set-password.ts and hand it over yourself."
    );
    process.exitCode = 1;
    return;
  }

  console.log(`UID ${uid}: ${record.name} <${record.email}>`);
  console.log(
    record.passwordHash
      ? `  Current code last emailed: ${record.passwordEmailedAt ?? "never (they set it themselves)"}`
      : "  No code issued yet."
  );

  if (!send) {
    console.log("\nPREVIEW — nothing changed. Re-run with --send to issue and email a new code.");
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

  try {
    await resendAccessCode(redis, record);
    console.log(`\nEmailed a new code to ${record.email}. The old one no longer works.`);
  } catch (error) {
    console.error(`\nFailed — ${(error as Error).message}`);
    console.error("Nothing changed; their current code still works.");
    process.exitCode = 1;
  } finally {
    mailer().close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
