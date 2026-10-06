/**
 * Lists students still signing in with the old shared starting code.
 *
 *   npx tsx scripts/find-shared-codes.ts                 # prints the UIDs
 *   npx tsx scripts/find-shared-codes.ts > shared.txt    # then:
 *   npx tsx scripts/resend-passwords.ts shared.txt       # preview
 *   npx tsx scripts/resend-passwords.ts shared.txt --send
 *
 * Until mid-October 2026 every new student was issued the same code, and that
 * code is in this public repository's history. Anyone who never changed it can
 * be signed in as by anyone who guesses their UID. This finds them; the resend
 * script gives each a private random code.
 *
 * Read-only. Checks each stored hash against the old code (scrypt, so it takes a
 * few seconds per hundred students). If production overrode the code with a
 * DEFAULT_ACCESS_CODE env var, pass that value with --code=<value>.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import type { CertRecord } from "../lib/certificates";
import { verifyPassword } from "../lib/certificates.server";
import { INDEX_KEY } from "../lib/roster";

/** The retired shared code. Already public in git history; kept only to detect it. */
const LEGACY_CODE = "isa@rait1234";

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
  const override = process.argv.find((a) => a.startsWith("--code="));
  const code = override ? override.slice("--code=".length) : LEGACY_CODE;

  loadEnv(resolve(process.cwd(), ".env.local"));
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (.env.local).");
    process.exit(1);
  }
  const redis = new Redis({ url, token });

  // String(): Upstash JSON-parses set members, so numeric-looking keys come back as numbers.
  const keys = (await redis.smembers(INDEX_KEY)).map(String);
  let checked = 0;
  let noCode = 0;
  const shared: CertRecord[] = [];

  for (let i = 0; i < keys.length; i += 100) {
    const chunk = keys.slice(i, i + 100);
    const records = await redis.mget<(CertRecord | null)[]>(...chunk);
    for (const record of records) {
      if (!record) continue;
      checked++;
      if (!record.passwordHash) {
        noCode++;
        continue;
      }
      if (await verifyPassword(code, record.passwordHash)) shared.push(record);
    }
  }

  // UIDs on stdout so the output can be redirected straight into a list file;
  // the summary goes to stderr so it doesn't end up in that file.
  for (const r of shared) console.log(r.uid);
  console.error(
    `\nChecked ${checked} student(s): ${shared.length} still on the shared code, ` +
      `${noCode} not issued a code yet.`
  );
  const noEmail = shared.filter((r) => !r.email).length;
  if (noEmail > 0) {
    console.error(`${noEmail} of them have no email address, so the resend script will skip them.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
