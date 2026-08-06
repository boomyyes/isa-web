/**
 * Issue and email access codes to everyone still waiting for one.
 *
 *   npx tsx scripts/send-passwords.ts           # preview — sends nothing
 *   npx tsx scripts/send-passwords.ts --send
 *
 * Manual fallback; the sheet's sync drains the same queue on its own. Use it when
 * SMTP was down during a sync or you've just filled in a missing address.
 *
 * Can't double-send: the queue only holds students with no code at all, and a
 * code is generated, emailed and dequeued in one step. Sending is opt-in because
 * it's irreversible and goes to real people.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import type { CertRecord } from "../lib/certificates";
import { redisKey } from "../lib/certificates.server";
import { deliverPendingCodes, PENDING_KEY } from "../lib/roster";
import { mailerConfigured, siteUrl } from "../lib/mailer";

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
  const send = process.argv.slice(2).includes("--send");

  loadEnv(resolve(process.cwd(), ".env.local"));

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (.env.local).");
    process.exit(1);
  }
  const redis = new Redis({ url, token });

  // Upstash JSON-parses set members, so numeric UIDs come back as numbers.
  const queued = (await redis.smembers(PENDING_KEY)).map(String);
  if (queued.length === 0) {
    console.log("Nobody is waiting for an access code.");
    return;
  }

  console.log(`${queued.length} student(s) waiting for an access code.\n`);

  let withoutEmail = 0;
  for (const uid of queued) {
    const record = await redis.get<CertRecord>(redisKey(uid));
    if (!record) {
      console.log(`  UID ${uid.padEnd(6)} (no longer on the roster — will be dropped)`);
      continue;
    }
    if (!record.email) {
      console.log(`  UID ${uid.padEnd(6)} ${"— no email address —".padEnd(32)} ${record.name}`);
      withoutEmail++;
      continue;
    }
    console.log(`  UID ${uid.padEnd(6)} ${record.email.padEnd(32)} ${record.name}`);
  }

  if (withoutEmail > 0) {
    console.log(
      `\n${withoutEmail} of them have no email address. Add it to the sheet and re-sync;` +
        `\nthey stay queued until then, so nothing is lost.`
    );
  }

  if (!send) {
    console.log(`\nSite link in the email: ${siteUrl()}/certificates`);
    console.log("\nPREVIEW — nothing sent. Re-run with --send to deliver.");
    return;
  }

  if (!mailerConfigured()) {
    console.error(
      "\nSMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and\n" +
        "MAIL_FROM in .env.local — see .env.example."
    );
    process.exit(1);
  }

  console.log("\nSending...\n");
  let sent = 0;
  let failed = 0;
  let guard = 0;

  for (;;) {
    const result = await deliverPendingCodes(redis, { limit: 25 });
    sent += result.sent;
    failed += result.failed;
    console.log(
      `  batch: sent ${result.sent}, failed ${result.failed}, remaining ${result.remaining}`
    );
    // Stop if the queue stops shrinking, so a persistent failure can't spin.
    if (result.remaining === 0 || result.sent === 0 || ++guard > 40) break;
  }

  console.log(`\nDone — ${sent} sent, ${failed} failed.`);
  if (failed > 0) {
    console.log("Failed students stayed queued; re-running retries just those.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
