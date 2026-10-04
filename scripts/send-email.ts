/**
 * Email one person a message you've written yourself.
 *
 *   npx tsx scripts/send-email.ts <uid|email> --subject "..." --body message.txt           # preview
 *   npx tsx scripts/send-email.ts <uid|email> --subject "..." --body message.txt --send
 *
 * A UID is looked up on the roster for their address and name; a bare address is
 * sent to as-is. The body is a plain-text file — blank lines split paragraphs, and
 * {name}, {firstName} and {uid} are filled in per recipient. The sign-off is added
 * for you.
 *
 * For many recipients at once, use send-email-list.ts.
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

async function main() {
  const args = process.argv.slice(2);
  const send = args.includes("--send");
  const subject = flag(args, "--subject");
  const bodyFile = flag(args, "--body");
  const target = args.find(
    (a, i) => !a.startsWith("--") && args[i - 1] !== "--subject" && args[i - 1] !== "--body"
  );

  if (!target || !subject || !bodyFile) {
    console.error(
      'Usage: npx tsx scripts/send-email.ts <uid|email> --subject "<subject>" --body <file.txt> [--send]'
    );
    process.exit(1);
  }
  if (!existsSync(bodyFile)) {
    console.error(`Body file not found: ${bodyFile}`);
    process.exit(1);
  }
  const template = readFileSync(bodyFile, "utf8");
  if (!template.trim()) {
    console.error(`Body file is empty: ${bodyFile}`);
    process.exit(1);
  }

  loadEnv(resolve(process.cwd(), ".env.local"));

  let to: string;
  let name = "";
  let uid = "";

  if (target.includes("@")) {
    to = target;
  } else {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      console.error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (.env.local).");
      process.exitCode = 1;
      return;
    }
    const record = await new Redis({ url, token }).get<CertRecord>(redisKey(target));
    if (!record) {
      console.error(`UID ${target} is not on the roster.`);
      process.exitCode = 1;
      return;
    }
    if (!record.email) {
      console.error(`UID ${target} (${record.name}) has no email address on the roster.`);
      process.exitCode = 1;
      return;
    }
    to = record.email;
    name = record.name;
    uid = String(record.uid);
  }

  const personalized = {
    to,
    subject: personalize(subject, { name, uid }),
    body: personalize(template, { name, uid }),
  };

  console.log(`To:      ${to}${name ? `  (${name}, UID ${uid})` : ""}`);
  console.log(`Subject: ${personalized.subject}`);
  console.log(`\n${personalized.body.trim()}\n\n— ISA RAIT Student Chapter`);

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

  try {
    await sendCustomEmail(personalized);
    console.log(`\nSent to ${to}.`);
  } finally {
    mailer().close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
