/**
 * Import the attendance sheet into Upstash Redis, from a CSV export.
 *
 *   npx tsx scripts/import-roster.ts roster.csv
 *   npx tsx scripts/import-roster.ts roster.csv --dry-run
 *   npx tsx scripts/import-roster.ts roster.csv --ext jpg
 *   npx tsx scripts/import-roster.ts roster.csv --force
 *   npx tsx scripts/import-roster.ts roster.csv --send      (also email new codes)
 *
 * MANUAL FALLBACK. The normal path is automatic: the Apps Script in the sheet
 * posts to /api/certificates/sync every few minutes, which runs this exact logic
 * (see lib/roster.ts) and mails new students their access codes. Reach for this
 * when you want a dry run first, when the sheet integration is down, or when
 * restoring from a CSV backup.
 *
 * The CSV is treated as the whole truth: records are added, updated, AND anyone
 * missing from the file is deleted. An import that would remove more than 20% of
 * the stored roster refuses to run — pass --force when that is intended.
 *
 * Access codes are NOT issued here by default. A new student is stored with an
 * empty hash, which queues them; the next sync (or --send) issues and emails the
 * code in one step, so the plaintext never touches disk.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import { deliverPendingCodes, parseSheet, reconcile } from "../lib/roster";
import { mailerConfigured } from "../lib/mailer";

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

/** RFC 4180 CSV reader — handles quoted fields, embedded commas, and "" escapes. */
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
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
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
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const send = args.includes("--send");
  const extIndex = args.indexOf("--ext");
  const extension = extIndex !== -1 ? args[extIndex + 1] : "png";
  const csvPath = args.find((a) => !a.startsWith("--") && a !== extension);

  if (!csvPath) {
    console.error(
      "Usage: npx tsx scripts/import-roster.ts <roster.csv> [--dry-run] [--ext png]\n" +
        "                                       [--force] [--send]"
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

  let parsed;
  try {
    parsed = parseSheet(parseCsv(readFileSync(resolve(csvPath), "utf8")), extension);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }

  console.log(`Header resolved — ${parsed.workshopCount} workshop(s), data from row ${parsed.dataStart + 1}.`);
  for (const warning of parsed.warnings) console.warn(`  ! ${warning}`);
  console.log(`Parsed ${parsed.rows.length} row(s)${parsed.skipped ? `, skipped ${parsed.skipped}` : ""}.`);

  const result = await reconcile(redis, parsed.rows, { force, dryRun });

  if (result.refused) {
    console.error(
      `\nREFUSING TO PROCEED — this ${result.refused}.\n\n` +
        `That usually means the CSV is incomplete or rows were deleted by accident.\n` +
        `Check the file first. If the removal is genuinely intended (for example,\n` +
        `replacing sample data with the real roster), re-run with --force.`
    );
    process.exit(1);
  }

  console.log(
    `\nPlan: ${result.written} to write, ${result.deleted} to delete ` +
      `(${result.stored} currently stored).`
  );
  console.log(`      ${result.registered} newly registered student(s) awaiting an access code.`);

  if (dryRun) {
    console.log("\n--dry-run — nothing written.");
    return;
  }

  console.log(`\nDone — ${result.written} record(s) in Redis${result.deleted ? `, ${result.deleted} removed` : ""}.`);

  if (result.registered === 0) {
    console.log("No new students — nothing to email.");
    return;
  }

  if (!send) {
    console.log(
      `\n${result.registered} student(s) are queued for an access code.\n` +
        "  The next sheet sync will issue and email them automatically.\n" +
        "  To do it now:  npx tsx scripts/import-roster.ts " + csvPath + " --send"
    );
    return;
  }

  if (!mailerConfigured()) {
    console.error("\n--send given but SMTP is not configured (see .env.example). Students stay queued.");
    process.exit(1);
  }

  console.log(`\nIssuing and emailing ${result.registered} access code(s)...`);
  let guard = 0;
  for (;;) {
    const delivery = await deliverPendingCodes(redis, { limit: 25 });
    console.log(
      `  sent ${delivery.sent}, failed ${delivery.failed}, ` +
        `no address ${delivery.skippedNoEmail}, remaining ${delivery.remaining}`
    );
    // Stop when the queue stops shrinking, so a persistent failure can't spin.
    if (delivery.remaining === 0 || delivery.sent === 0 || ++guard > 40) break;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
