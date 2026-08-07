/**
 * Set a specific access code for one student, and email it to them.
 *
 *   npx tsx scripts/set-password.ts 7 "12345678" [--no-email]
 *
 * Only for when the code has to be a particular value — testing the mailer, or
 * reading a replacement out over the phone. Normally students reset their own.
 *
 * A chosen code is only as strong as you make it; generated ones carry ~40 bits.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import { normalizePassword, type CertRecord } from "../lib/certificates";
import { hashPassword, redisKey } from "../lib/certificates.server";
import { mailerConfigured, sendAccessCodeEmail } from "../lib/mailer";
import { PENDING_KEY } from "../lib/roster";

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
  const noEmail = args.includes("--no-email");
  const [uid, password] = args.filter((a) => !a.startsWith("--"));

  if (!uid || !password) {
    console.error('Usage: npx tsx scripts/set-password.ts <uid> "<access code>" [--no-email]');
    process.exit(1);
  }

  const canonical = normalizePassword(password);
  if (canonical.length < 6) {
    console.error(
      `Refusing: "${password}" normalises to ${canonical.length} character(s).\n` +
        "Access codes are upper-cased with punctuation stripped before hashing, so\n" +
        "anything shorter than 6 is trivially guessable. Use at least 6."
    );
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
    console.error(
      `UID ${uid} is not on the roster. Add them to the sheet and run the import first.`
    );
    process.exit(1);
  }

  await redis.set(redisKey(uid), {
    ...record,
    passwordHash: await hashPassword(password),
    passwordEmailedAt: new Date().toISOString(),
  } satisfies CertRecord);

  // Out of the queue, or the next sync overwrites this with a generated code.
  await redis.srem(PENDING_KEY, uid);

  console.log(`Set access code for UID ${uid} (${record.name}).`);
  console.log(`  Sign in with: ${uid} / ${password}`);
  console.log(`  Stored normalised as: ${canonical}  (case-insensitive, punctuation ignored)`);

  if (noEmail) {
    console.log("\n--no-email: nothing was sent. Hand the code over yourself.");
    return;
  }

  if (!record.email) {
    console.log("\nThis student has no email address, so nothing was sent.");
    return;
  }

  if (!mailerConfigured()) {
    console.log(
      "\nSMTP is not configured, so no email was sent — the code above is set and working.\n" +
        "Fill in SMTP_* and MAIL_FROM in .env.local to have this delivered automatically."
    );
    return;
  }

  try {
    await sendAccessCodeEmail({ to: record.email, name: record.name, uid, password });
    console.log(`\nEmailed it to ${record.email}.`);
  } catch (error) {
    console.error(`\nThe code is set, but the email failed — ${(error as Error).message}`);
    console.error("Pass it on by hand, or fix SMTP and re-run.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
