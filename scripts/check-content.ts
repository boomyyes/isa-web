/**
 * Validates every file in content/site against lib/content/collections.ts.
 * Runs before every build (package.json "prebuild"), so a bad edit — by hand or
 * from the admin editor — fails the deploy instead of breaking the live site.
 *
 *   npx tsx scripts/check-content.ts
 */

import { readFileSync } from "node:fs";
import { COLLECTIONS, collectionSchema } from "../lib/content/collections";

let failed = false;
const load = (file: string) => JSON.parse(readFileSync(file, "utf8")) as unknown;

for (const collection of COLLECTIONS) {
  let data: unknown;
  try {
    data = load(collection.file);
  } catch (error) {
    console.error(`✗ ${collection.file}: not valid JSON — ${(error as Error).message}`);
    failed = true;
    continue;
  }
  const result = collectionSchema(collection).safeParse(data);
  if (!result.success) {
    failed = true;
    for (const issue of result.error.issues) {
      console.error(`✗ ${collection.file} › ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
  }
}

// Across files: every event must belong to a tenure that has a section.
const tenures = new Set((load("content/site/tenures.json") as { id: string }[]).map((t) => t.id));
for (const event of load("content/site/events.json") as { id: string; tenure: string }[]) {
  if (!tenures.has(event.tenure)) {
    failed = true;
    console.error(`✗ content/site/events.json › ${event.id}: tenure "${event.tenure}" isn't in tenures.json`);
  }
}

if (failed) {
  console.error("\nContent check failed. Fix the file(s) above, or restore an earlier version from the admin area.");
  process.exit(1);
}
console.log(`✓ content: ${COLLECTIONS.length} files valid`);
