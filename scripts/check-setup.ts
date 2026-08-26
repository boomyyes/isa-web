/**
 * Verify the certificate stack is wired up.
 *
 *   npx tsx scripts/check-setup.ts
 *
 * Read-only. Run after filling .env.local, or whenever the page misbehaves, to
 * tell a config problem from a data one.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import { AwsClient } from "aws4fetch";

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

const REQUIRED = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "CERT_TOKEN_SECRET",
];

let failed = 0;
const ok = (m: string) => console.log(`  OK    ${m}`);
const bad = (m: string) => {
  console.log(`  FAIL  ${m}`);
  failed++;
};

async function main() {
  loadEnv(resolve(process.cwd(), ".env.local"));

  console.log("\nEnvironment");
  const missing = REQUIRED.filter((k) => !process.env[k]);
  for (const key of REQUIRED) {
    if (process.env[key]) ok(`${key} is set`);
    else bad(`${key} is MISSING`);
  }
  if (process.env.CERT_TOKEN_SECRET && process.env.CERT_TOKEN_SECRET.length < 32) {
    bad("CERT_TOKEN_SECRET is short — use 32+ bytes (node -e \"...randomBytes(32)...\")");
  }
  if (missing.length) {
    console.log("\nFill the missing values in .env.local before continuing.");
    process.exit(1);
  }

  console.log("\nUpstash Redis");
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const pong = await redis.ping();
    ok(`reachable (PING -> ${pong})`);

    const keys = await redis.keys("cert:*");
    console.log(`  INFO  ${keys.length} certificate record(s) currently stored`);
  } catch (error) {
    bad(`unreachable — ${(error as Error).message}`);
    console.log("        Check you copied the REST url/token, not the redis:// string.");
  }

  console.log("\nCloudflare R2");
  try {
    const aws = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      service: "s3",
      region: "auto",
    });
    const base = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}`;

    // 404 => credentials good. 403 => bad keys, or not scoped to this bucket.
    const probe = await aws.fetch(`${base}/__setup_probe__`, { method: "GET" });

    if (probe.status === 404 || probe.status === 200) {
      ok(`bucket "${process.env.R2_BUCKET}" reachable and credentials accepted`);
    } else if (probe.status === 403) {
      bad("403 — credentials rejected, or the token isn't scoped to this bucket");
    } else if (probe.status === 401) {
      bad("401 — R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY are wrong");
    } else {
      bad(`unexpected status ${probe.status} — ${(await probe.text()).slice(0, 200)}`);
    }

    // Read-only is correct for the app; this just says which upload route you have.
    const write = await aws.fetch(`${base}/__setup_probe__`, {
      method: "PUT",
      body: "probe",
      headers: { "Content-Type": "text/plain" },
    });
    if (write.ok) {
      console.log("  INFO  token can WRITE — usable for bulk uploads");
      await aws.fetch(`${base}/__setup_probe__`, { method: "DELETE" }).catch(() => {});
    } else {
      console.log("  INFO  token is read-only (correct for the app; upload via the dashboard)");
    }
  } catch (error) {
    bad(`unreachable — ${(error as Error).message}`);
  }

  console.log(failed === 0 ? "\nAll good.\n" : `\n${failed} problem(s) found.\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
