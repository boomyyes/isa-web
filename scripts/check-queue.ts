/**
 * Count the students waiting for an access code email.
 *
 *   npx tsx scripts/check-queue.ts
 *   npx tsx scripts/check-queue.ts --list
 *
 * Read-only — sends nothing and dequeues nothing. Answers "is the queue moving?"
 * without the risk of send-passwords.ts, which drains the same queue.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import type { CertRecord } from "../lib/certificates";
import { redisKey } from "../lib/certificates.server";
import { PENDING_KEY } from "../lib/roster";
import { mailerConfigured } from "../lib/mailer";

/** Matches the sync route's DELIVER_LIMIT, so the run estimate below is honest. */
const DELIVER_LIMIT = 15;

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
  const list = process.argv.slice(2).includes("--list");

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
    console.log("\nQueue is empty — nobody is waiting for an access code.\n");
    return;
  }

  // Classified the same way deliverPendingCodes() does, so the counts predict
  // what the next drain will actually do.
  const ready: { uid: string; email: string; name: string }[] = [];
  const noEmail: { uid: string; name: string }[] = [];
  const stale: string[] = [];

  for (const uid of queued) {
    const record = await redis.get<CertRecord>(redisKey(uid));
    if (!record || record.passwordHash) {
      // Off the roster, or coded by hand since — dequeued without a send.
      stale.push(uid);
    } else if (!record.email) {
      noEmail.push({ uid, name: record.name });
    } else {
      ready.push({ uid, email: record.email, name: record.name });
    }
  }

  console.log(`\n${queued.length} UID(s) in the queue (${PENDING_KEY})\n`);
  console.log(`  ${String(ready.length).padStart(4)}  will be emailed on the next drain`);
  console.log(`  ${String(noEmail.length).padStart(4)}  have no email address — stay queued`);
  console.log(`  ${String(stale.length).padStart(4)}  stale — dequeued without a send`);

  if (list) {
    if (ready.length) {
      console.log("\nReady to send");
      for (const r of ready) {
        console.log(`  UID ${r.uid.padEnd(6)} ${r.email.padEnd(32)} ${r.name}`);
      }
    }
    if (noEmail.length) {
      console.log("\nNo email address");
      for (const r of noEmail) console.log(`  UID ${r.uid.padEnd(6)} ${r.name}`);
    }
    if (stale.length) {
      console.log(`\nStale: ${stale.join(", ")}`);
    }
  }

  if (ready.length > 0) {
    // The sheet's trigger runs every 15 min and drains DELIVER_LIMIT per run.
    const runs = Math.ceil(ready.length / DELIVER_LIMIT);
    console.log(
      `\n${runs} sync run(s) at ${DELIVER_LIMIT}/run to clear — about ${runs * 15} minute(s)` +
        `\non the 15-minute trigger. Run send-passwords.ts --send to drain it now.`
    );
  }

  if (noEmail.length > 0) {
    console.log(
      `\n${noEmail.length} are stuck only for want of an address. Add it to the sheet` +
        `\nand re-sync; nothing is lost while they wait.`
    );
  }

  if (!mailerConfigured()) {
    console.log("\nNote: SMTP is not configured here, so nothing can drain the queue.");
  }

  console.log();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
