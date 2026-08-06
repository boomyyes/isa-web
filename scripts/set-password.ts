/**
 * Set a specific access code for one student.
 *
 *   npx tsx scripts/set-password.ts 7 "12345678"
 *   npx tsx scripts/set-password.ts 7 "12345678" --no-email
 *
 * Normally you never need this — the import issues random codes, and
 * `--regenerate-uid=<uid>` reissues one. Use this when the code has to be a
 * particular value: testing the mailer, or reading a replacement out to a
 * student over the phone.
 *
 * By default it also:
 *   - clears the student's "already emailed" stamp, and
 *   - writes the code into new-access-codes.csv,
 * so `npx tsx scripts/send-passwords.ts --send` will deliver this exact code.
 * Pass --no-email to set the code silently without queueing a message.
 *
 * A chosen code is only as strong as you make it. Generated codes carry ~40 bits
 * of entropy; a short numeric one is guessable in far fewer tries, so keep those
 * to testing or to accounts you re-secure afterwards.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import { normalizePassword, type CertRecord } from "../lib/certificates";
import { hashPassword, redisKey } from "../lib/certificates.server";

const HANDOUT_FILE = "new-access-codes.csv";

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

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

/**
 * Add or replace this student's row in the handout, leaving other rows intact —
 * the file may already hold codes for students who haven't been mailed yet.
 */
function upsertHandout(path: string, uid: string, name: string, email: string, password: string) {
  const header = "UID,Name,Email,Password";
  const row = [uid, name, email, password].map(csvCell).join(",");

  if (!existsSync(path)) {
    writeFileSync(path, `${header}\n${row}\n`, "utf8");
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter((l) => l.trim() !== "");
  const kept = lines
    .slice(1)
    .filter((line) => !new RegExp(`^"?${uid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"?,`).test(line));

  writeFileSync(path, [header, ...kept, row].join("\n") + "\n", "utf8");
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
    // Clearing the stamp is what re-arms the mailer for this student.
    passwordEmailedAt: noEmail ? record.passwordEmailedAt : null,
  } satisfies CertRecord);

  console.log(`Set access code for UID ${uid} (${record.name}).`);
  console.log(`  Sign in with: ${uid} / ${password}`);
  console.log(`  Stored normalised as: ${canonical}  (case-insensitive, punctuation ignored)`);

  if (noEmail) {
    console.log("\n--no-email: the emailed stamp was left as-is and the handout not touched.");
    return;
  }

  if (!record.email) {
    console.log("\nThis student has no email address, so nothing was queued to send.");
    return;
  }

  upsertHandout(resolve(process.cwd(), HANDOUT_FILE), uid, record.name, record.email, password);
  console.log(`\nQueued in ${HANDOUT_FILE} for ${record.email}.`);
  console.log("  npx tsx scripts/send-passwords.ts          (preview)");
  console.log("  npx tsx scripts/send-passwords.ts --send   (deliver)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
