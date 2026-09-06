/**
 * Rehearse the Artemis reveal.
 *
 *   npx tsx scripts/artemis-rehearse.ts          # seal breaks in 45 seconds
 *   npx tsx scripts/artemis-rehearse.ts 90       # ...or in 90
 *   npx tsx scripts/artemis-rehearse.ts --clear  # back to the real date
 *
 * The build-up and the break only play for someone already on the page when the
 * clock runs out, so on the day itself there is exactly one chance to see them.
 * This moves the release to a few seconds from now so you can watch the whole
 * thing as often as you like.
 *
 * It writes ARTEMIS_RELEASE_AT_DEV into .env.local and nothing else — the real
 * date in lib/artemis.ts is never touched, so there is no edit to forget to
 * revert. lib/artemis-trials.ts ignores the override entirely in a production
 * build, so it cannot follow you to the deployed site.
 *
 * `next dev` reloads .env.local on its own; give it a second, then reload the
 * page and wait.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const KEY = "ARTEMIS_RELEASE_AT_DEV";
const ENV_PATH = resolve(process.cwd(), ".env.local");
const DEFAULT_SECONDS = 45;

function fail(message: string): never {
  console.error("✗ " + message);
  process.exit(1);
}

const args = process.argv.slice(2);
const clearing = args.includes("--clear");

let seconds = DEFAULT_SECONDS;
if (!clearing && args.length) {
  const value = Number(args[0]);
  if (!Number.isFinite(value) || value < 5) {
    fail(
      `Give a number of seconds (5 or more), or --clear. Got: ${args[0]}\n` +
        "  Under five seconds and the page cannot be reloaded in time to watch."
    );
  }
  seconds = value;
}

if (!existsSync(ENV_PATH)) {
  fail(".env.local does not exist — nothing to write to.");
}

const original = readFileSync(ENV_PATH, "utf8");
const eol = original.includes("\r\n") ? "\r\n" : "\n";

// Every line except the key and the comment block this script wrote last time,
// so repeated runs replace rather than pile up.
const kept = original
  .split(/\r?\n/)
  .filter(
    (line) =>
      !line.startsWith(KEY + "=") && !line.startsWith("# Artemis rehearsal —")
  );

// Trailing blank lines, so the file does not grow one every run.
while (kept.length && kept[kept.length - 1].trim() === "") kept.pop();

if (clearing) {
  writeFileSync(ENV_PATH, kept.join(eol) + eol);
  console.log(`✓ ${KEY} cleared. The release is back to the real date in lib/artemis.ts.`);
  process.exit(0);
}

if (!original.includes("ARTEMIS_TRIALS=")) {
  console.warn(
    "! ARTEMIS_TRIALS is not set in .env.local, so the seal will break onto an\n" +
      "  empty section. Set it first — see .env.example.\n"
  );
}

const at = Date.now() + seconds * 1000;

const block = [
  "",
  "# Artemis rehearsal — written by scripts/artemis-rehearse.ts, dev only.",
  "# Ignored in a production build. Remove it with --clear.",
  `${KEY}=${at}`,
  "",
].join(eol);

writeFileSync(ENV_PATH, kept.join(eol) + eol + block);

const clock = new Date(at).toLocaleTimeString();
console.log(`✓ The seal breaks at ${clock} — ${seconds} seconds from now.`);
console.log("");
console.log("  Open http://localhost:3000/artemis and leave it on screen.");
console.log("  Watch for: the rim stirring in the last minute, the tick marks");
console.log("  draining over the final ten seconds, then the seal splitting and");
console.log("  the three statements arriving on their own.");
console.log("");
console.log("  Again:  npx tsx scripts/artemis-rehearse.ts");
console.log("  Done:   npx tsx scripts/artemis-rehearse.ts --clear");
