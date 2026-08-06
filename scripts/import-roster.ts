/**
 * Import the attendance sheet into Upstash Redis.
 *
 *   npx tsx scripts/import-roster.ts roster.csv
 *   npx tsx scripts/import-roster.ts roster.csv --dry-run
 *   npx tsx scripts/import-roster.ts roster.csv --ext jpg
 *   npx tsx scripts/import-roster.ts roster.csv --force
 *
 * The CSV is treated as the whole truth: records are added, updated, AND anyone
 * missing from the file is deleted. So this is the single update path after any
 * change to the sheet. Export it (File > Download > CSV) and run this.
 *
 * As a guard against a truncated export or an accidental block-delete, an import
 * that would remove more than 20% of the stored roster refuses to run. Use
 * --force when the removal is genuinely intended.
 *
 * Access codes: a NEW UID gets a freshly generated code, hashed into Redis, with
 * the plaintext written to new-access-codes.csv for scripts/send-passwords.ts to
 * mail out. An existing UID keeps the code it already has — codes are hashed and
 * therefore unrecoverable, so regenerating on every import would silently lock
 * the whole roster out. Use --regenerate-uid=<uid> to reissue for one student.
 *
 * The sheet's two-row merged header is handled directly:
 *
 *   UID,Name,College,Roll No.,Phone,Email,WKS 1,,WKS 2,,WKS 3,
 *   ,,,,,,Attended?,Received?,Attended?,Received?,Attended?,Received?
 *
 * A flattened single-row header ("WKS 1 Attended?", ...) works too. Checkboxes
 * export as TRUE/FALSE; TRUE/1/yes/y are all accepted.
 *
 * Certificate images are NOT uploaded by this script — put them in R2 under
 * `{workshopId}/{roll}.png` first (dashboard, rclone, or `aws s3 cp` against the
 * S3-compatible endpoint). This script only records the object keys.
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import { WORKSHOPS, type CertRecord, type WorkshopRecord } from "../lib/certificates";
import { generatePassword, hashPassword, redisKey } from "../lib/certificates.server";

// ---------------------------------------------------------------- env loading

/**
 * Minimal .env.local reader. tsx doesn't load env files, and pulling in dotenv
 * for six variables isn't worth a dependency.
 */
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

// ------------------------------------------------------------------ csv parse

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

/** Set of every `cert:*` key the last import wrote. Lets a re-import delete removals. */
const INDEX_KEY = "roster:index";

/** Refuse an import that would delete more than this share of the stored roster. */
const MAX_DELETE_FRACTION = 0.2;

/** Where newly issued plaintext access codes are written for the mailer to pick up. */
const HANDOUT_FILE = "new-access-codes.csv";

const TRUTHY = new Set(["true", "1", "yes", "y", "x", "✓"]);
const isChecked = (value: string | undefined) =>
  TRUTHY.has((value ?? "").trim().toLowerCase());

// --------------------------------------------------------------- header logic

/**
 * Collapse the header into one label per column.
 *
 * With a merged two-row header, the group label ("WKS 1") only appears above the
 * first of its two columns, so it is forward-filled across the group before
 * being joined with the second row ("Attended?" / "Received?").
 */
function resolveHeader(rows: string[][]): { header: string[]; dataStart: number } {
  const [first, second] = rows;
  const hasGroupRow =
    second !== undefined &&
    /attended/i.test(second.join(" ")) &&
    !/attended/i.test(first.join(" "));

  if (!hasGroupRow) {
    return { header: first.map((h) => h.trim()), dataStart: 1 };
  }

  let carried = "";
  const header = second.map((sub, i) => {
    const group = (first[i] ?? "").trim();
    if (group) carried = group;
    return `${carried} ${sub}`.trim();
  });
  return { header, dataStart: 2 };
}

function findColumn(header: string[], pattern: RegExp): number {
  return header.findIndex((h) => pattern.test(h));
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Build the pattern that identifies one workshop's column group in the header.
 *
 * By default the group label is derived from the digits in the id, so "wks-2"
 * matches "WKS 2", "WKS2" and "Workshop 2". An id without digits can't be
 * derived from — that's what `sheetLabel` is for.
 */
function groupPattern(id: string, sheetLabel?: string): RegExp | null {
  if (sheetLabel) return new RegExp(escapeRegExp(sheetLabel), "i");

  const number = /(\d+)/.exec(id)?.[1];
  if (!number) return null;
  return new RegExp(`(?:wks|workshop)\\s*0*${number}\\b`, "i");
}

/** Locate the Attended?/Received? column pair for each workshop in the catalog. */
function findWorkshopColumns(header: string[]) {
  const byWorkshop = new Map<string, { attended: number; received: number }>();

  for (const { id, sheetLabel } of WORKSHOPS) {
    const group = groupPattern(id, sheetLabel);

    // Never fall through silently: an unmatched workshop would mark the whole
    // roster absent for it, which looks identical to nobody having attended.
    if (!group) {
      console.warn(
        `  ! "${id}" has no number to match on — add sheetLabel to its entry in ` +
          `lib/certificates.ts (e.g. sheetLabel: "WKS 1"). Treating everyone as absent.`
      );
      continue;
    }

    const attended = header.findIndex((h) => group.test(h) && /attend/i.test(h));
    const received = header.findIndex((h) => group.test(h) && /receiv/i.test(h));

    if (attended === -1 && received === -1) {
      console.warn(`  ! no columns in the CSV matched "${id}" — treating everyone as absent`);
      continue;
    }
    if (attended === -1) console.warn(`  ! "${id}" has a Received? column but no Attended? column`);
    if (received === -1) console.warn(`  ! "${id}" has no Received? column — assuming nobody has collected one`);

    byWorkshop.set(id, { attended, received });
  }

  if (byWorkshop.size === 0) {
    console.warn("  ! NO workshop columns matched at all — every record would import as absent.");
  }

  return byWorkshop;
}

// ----------------------------------------------------------------------- main

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const regenerateAll = args.includes("--regenerate");
  const extIndex = args.indexOf("--ext");
  const extension = extIndex !== -1 ? args[extIndex + 1] : "png";
  const csvPath = args.find((a) => !a.startsWith("--") && a !== extension);

  // --regenerate-uid=1,5,9 — reissue codes for named students only (someone lost
  // theirs). --regenerate does the whole roster, which invalidates everyone's.
  const regenerateUids = new Set(
    (args.find((a) => a.startsWith("--regenerate-uid=")) ?? "")
      .split("=")[1]
      ?.split(",")
      .map((v) => v.trim())
      .filter(Boolean) ?? []
  );

  if (!csvPath) {
    console.error(
      "Usage: npx tsx scripts/import-roster.ts <roster.csv> [--dry-run] [--ext png]\n" +
        "                                       [--force] [--regenerate] [--regenerate-uid=1,5]"
    );
    process.exit(1);
  }

  loadEnv(resolve(process.cwd(), ".env.local"));

  const rows = parseCsv(readFileSync(resolve(csvPath), "utf8")).filter((r) =>
    r.some((cell) => cell.trim() !== "")
  );
  if (rows.length < 2) {
    console.error("CSV has no data rows.");
    process.exit(1);
  }

  const { header, dataStart } = resolveHeader(rows);
  const col = {
    uid: findColumn(header, /^uid$/i),
    name: findColumn(header, /^name$/i),
    college: findColumn(header, /college/i),
    email: findColumn(header, /e-?mail/i),
  };

  if (col.uid === -1 || col.name === -1 || col.email === -1) {
    console.error("CSV must have UID, Name and Email columns. Found:", header);
    process.exit(1);
  }

  const workshopColumns = findWorkshopColumns(header);
  console.log(`Header resolved — ${workshopColumns.size} workshop(s), data from row ${dataStart + 1}.`);

  type Parsed = {
    key: string;
    uid: string;
    name: string;
    college: string;
    email: string;
    workshops: Record<string, WorkshopRecord>;
  };

  const parsed: Parsed[] = [];
  const seen = new Map<string, number>();
  let skipped = 0;

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    const uid = (row[col.uid] ?? "").trim();
    const email = (row[col.email] ?? "").trim().toLowerCase();

    if (!uid) {
      console.warn(`  ! row ${i + 1}: missing UID — skipped`);
      skipped++;
      continue;
    }

    // UID is the primary key, so a duplicate would silently overwrite the
    // earlier row. Surface it — it's almost always a data-entry slip.
    const previous = seen.get(uid);
    if (previous !== undefined) {
      console.warn(`  ! row ${i + 1}: duplicate UID "${uid}" (also row ${previous}) — later row wins`);
    }
    seen.set(uid, i + 1);

    // Email is no longer required to log in, but without it this student can
    // never be sent their access code.
    if (!email || !email.includes("@")) {
      console.warn(`  ! row ${i + 1} (UID ${uid}): no email — they can't be sent their access code`);
    }

    const workshops: Record<string, WorkshopRecord> = {};
    for (const { id } of WORKSHOPS) {
      const columns = workshopColumns.get(id);
      const attended = columns ? isChecked(row[columns.attended]) : false;
      workshops[id] = {
        attended,
        received: columns ? isChecked(row[columns.received]) : false,
        // Only point at an object we expect to exist. A non-attendee has no image.
        cert: attended ? `${id}/${uid}.${extension}` : null,
      };
    }

    parsed.push({
      key: redisKey(uid),
      uid,
      name: (row[col.name] ?? "").trim(),
      college: col.college === -1 ? "" : (row[col.college] ?? "").trim(),
      email,
      workshops,
    });
  }

  console.log(`Parsed ${parsed.length} row(s)${skipped ? `, skipped ${skipped}` : ""}.`);

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (.env.local).");
    process.exit(1);
  }

  const redis = new Redis({ url, token });

  // --- carry existing access codes forward ----------------------------------
  //
  // Codes are hashed, so they can't be recovered — regenerating on every import
  // would silently invalidate everyone's code each time the roster is touched.
  // An existing student keeps their hash (and their emailed-at stamp); only a
  // genuinely new UID gets a fresh code.
  const existing = new Map<string, CertRecord>();
  const FETCH_BATCH = 100;
  for (let i = 0; i < parsed.length; i += FETCH_BATCH) {
    const slice = parsed.slice(i, i + FETCH_BATCH);
    const pipeline = redis.pipeline();
    for (const p of slice) pipeline.get<CertRecord>(p.key);
    const results = (await pipeline.exec()) as (CertRecord | null)[];
    results.forEach((value, j) => {
      if (value) existing.set(slice[j].key, value);
    });
  }

  const records: { key: string; record: CertRecord }[] = [];
  /** Plaintext codes for students who need to be told — new registrations only. */
  const handout: { uid: string; name: string; email: string; password: string }[] = [];

  for (const p of parsed) {
    const prior = existing.get(p.key);
    const regenerate = regenerateAll || regenerateUids.has(p.uid);

    let passwordHash: string;
    let passwordEmailedAt: string | null;

    if (prior?.passwordHash && !regenerate) {
      passwordHash = prior.passwordHash;
      passwordEmailedAt = prior.passwordEmailedAt ?? null;
    } else {
      const password = generatePassword();
      passwordHash = await hashPassword(password);
      // A regenerated code must be re-sent, so clear the stamp.
      passwordEmailedAt = null;
      handout.push({ uid: p.uid, name: p.name, email: p.email, password });
    }

    records.push({
      key: p.key,
      record: {
        uid: p.uid,
        name: p.name,
        college: p.college,
        email: p.email,
        passwordHash,
        passwordEmailedAt,
        workshops: p.workshops,
      },
    });
  }

  // --- work out what this import would remove -------------------------------
  //
  // The CSV is the whole truth: anyone in Redis but not in the file has been
  // taken off the roster and must go. `roster:index` records the keys the last
  // import wrote, so the difference is computable without scanning the keyspace.
  const newKeys = records.map((r) => r.key);
  const newKeySet = new Set(newKeys);

  let knownKeys = await redis.smembers(INDEX_KEY);
  if (knownKeys.length === 0) {
    // No index yet — either a first run, or data written before the index
    // existed. Fall back to a scan so that pre-existing records still get
    // reconciled instead of being orphaned forever.
    knownKeys = await redis.keys("cert:*");
    if (knownKeys.length > 0) {
      console.log(`  (no index found — reconciling against ${knownKeys.length} existing key(s))`);
    }
  }

  const stale = knownKeys.filter((key) => !newKeySet.has(key));

  console.log(
    `\nPlan: ${records.length} to write, ${stale.length} to delete ` +
      `(${knownKeys.length} currently stored).`
  );
  console.log(
    `      ${handout.length} new access code(s), ` +
      `${records.length - handout.length} carried forward unchanged.`
  );

  // --- safety brake ---------------------------------------------------------
  //
  // A truncated export or an accidental block-delete in the sheet shows up as a
  // large drop. Refuse it rather than quietly stripping people of certificates.
  const allowedDeletions = Math.max(1, Math.floor(knownKeys.length * MAX_DELETE_FRACTION));
  if (stale.length > allowedDeletions && !force) {
    const percent = Math.round((stale.length / knownKeys.length) * 100);
    console.error(
      `\nREFUSING TO PROCEED — this would delete ${stale.length} of ${knownKeys.length} ` +
        `record(s) (${percent}%).\n\n` +
        `That usually means the CSV is incomplete or rows were deleted by accident.\n` +
        `Check the file first. If the removal is genuinely intended (for example,\n` +
        `replacing sample data with the real roster), re-run with --force.`
    );
    process.exit(1);
  }

  if (dryRun) {
    console.log("\n--dry-run — nothing written. First record:\n");
    // Redact the hash so a dry run pasted into a chat doesn't leak it.
    console.log(JSON.stringify({ ...records[0], record: { ...records[0].record, passwordHash: "<hashed>" } }, null, 2));
    if (stale.length > 0) {
      console.log(`\nWould also delete ${stale.length} record(s) no longer in the CSV.`);
    }
    if (handout.length > 0) {
      console.log(`Would issue ${handout.length} new access code(s) and write ${HANDOUT_FILE}.`);
    }
    return;
  }

  // --- write ----------------------------------------------------------------
  //
  // Batch into pipelines so a large roster doesn't become one request per row —
  // the free tier is metered per command, and per-request overhead dominates.
  const BATCH = 100;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const pipeline = redis.pipeline();
    for (const { key, record } of batch) pipeline.set(key, record);
    await pipeline.exec();
    console.log(`  wrote ${Math.min(i + BATCH, records.length)}/${records.length}`);
  }

  // del/sadd are typed as taking at least one argument, which a plain slice
  // can't prove; the loop bounds already guarantee each chunk is non-empty.
  for (let i = 0; i < stale.length; i += BATCH) {
    const chunk = stale.slice(i, i + BATCH) as [string, ...string[]];
    await redis.del(...chunk);
    console.log(`  deleted ${Math.min(i + BATCH, stale.length)}/${stale.length}`);
  }

  // Rebuild the index last, so a crash mid-write leaves the old index in place
  // and the next run re-reconciles rather than losing track of existing keys.
  await redis.del(INDEX_KEY);
  for (let i = 0; i < newKeys.length; i += BATCH) {
    const chunk = newKeys.slice(i, i + BATCH) as [string, ...string[]];
    await redis.sadd(INDEX_KEY, ...chunk);
  }

  console.log(
    `\nDone — ${records.length} record(s) in Redis` +
      (stale.length ? `, ${stale.length} removed` : "") +
      "."
  );

  // --- handout --------------------------------------------------------------
  //
  // Access codes are stored hashed, so this file is the ONLY copy of the
  // plaintext. It exists solely to feed scripts/send-passwords.ts; delete it
  // once the mail has gone out.
  if (handout.length > 0) {
    const csv = [
      "UID,Name,Email,Password",
      ...handout.map((h) =>
        [h.uid, h.name, h.email, h.password].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    writeFileSync(resolve(process.cwd(), HANDOUT_FILE), csv + "\n", "utf8");

    const missingEmail = handout.filter((h) => !h.email).length;
    console.log(`\nWrote ${HANDOUT_FILE} — ${handout.length} new access code(s).`);
    if (missingEmail > 0) {
      console.log(`  ! ${missingEmail} of them have no email address and must be handed over in person.`);
    }
    console.log(
      "\n  This file contains PLAINTEXT access codes and is the only copy.\n" +
        "  Next:  npx tsx scripts/send-passwords.ts        (preview)\n" +
        "         npx tsx scripts/send-passwords.ts --send (actually email them)\n" +
        "  Then delete it."
    );
  } else {
    console.log("\nNo new students — no access codes issued, nothing to email.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
