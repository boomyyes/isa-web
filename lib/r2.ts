// Presigned reads for the private R2 bucket. The browser is redirected straight
// to R2 rather than proxied, so downloads cost no serverless bandwidth.
// aws4fetch over the AWS SDK: a few KB, and query signing is all we need.

import { AwsClient } from "aws4fetch";

let client: AwsClient | null = null;

function aws(): AwsClient {
  if (client) return client;

  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY are not set");
  }

  // R2 ignores the region but SigV4 requires one; "auto" is Cloudflare's value.
  client = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
  return client;
}

function objectUrl(key: string): string {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !bucket) {
    throw new Error("R2_ACCOUNT_ID / R2_BUCKET are not set");
  }

  // Encode each segment individually so "wks-1/121.png" keeps its separator.
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${path}`;
}

/** Tried in order when the stored key misses. First hit wins. */
const CERT_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "svg"];

async function exists(key: string): Promise<boolean> {
  const response = await aws().fetch(objectUrl(key), { method: "HEAD" });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`R2 HEAD ${key} -> ${response.status}`);
  return true;
}

/**
 * Roster rows guess the extension when attendance is marked, so the stored key
 * can be wrong even though the file is there. Returns the key that actually
 * exists — the stored one if possible — or null if nothing is uploaded yet.
 */
export async function resolveObjectKey(key: string): Promise<string | null> {
  if (await exists(key)) return key;

  const dot = key.lastIndexOf(".");
  if (dot <= key.lastIndexOf("/")) return null;

  const stem = key.slice(0, dot);
  const stored = key.slice(dot + 1).toLowerCase();
  for (const extension of CERT_EXTENSIONS) {
    if (extension === stored) continue;
    if (await exists(`${stem}.${extension}`)) return `${stem}.${extension}`;
  }
  return null;
}

/** `downloadName` is signed in, so it can't be tampered with afterwards. */
export async function presignGet(
  key: string,
  ttlSeconds: number,
  downloadName?: string
): Promise<string> {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
  if (downloadName) {
    url.searchParams.set(
      "response-content-disposition",
      `attachment; filename="${downloadName.replace(/"/g, "")}"`
    );
  }

  const signed = await aws().sign(url.toString(), {
    method: "GET",
    aws: { signQuery: true },
  });

  return signed.url;
}

/**
 * A short-lived URL the browser can PUT one file to, straight into the bucket.
 * For files too big to pass through a serverless function (their request
 * bodies cap out around 4.5 MB). Needs the bucket's CORS policy to allow PUT
 * from the admin origin.
 */
export async function presignPut(key: string, ttlSeconds: number): Promise<string> {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
  const signed = await aws().sign(url.toString(), { method: "PUT", aws: { signQuery: true } });
  return signed.url;
}

/** Size and type of a stored object, or null if it isn't there. */
export async function headObject(key: string): Promise<{ size: number; type: string } | null> {
  const response = await aws().fetch(objectUrl(key), { method: "HEAD" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`R2 HEAD ${key} -> ${response.status}`);
  return {
    size: Number(response.headers.get("content-length") ?? 0),
    type: response.headers.get("content-type") ?? "",
  };
}

/**
 * Uploads to the private bucket. Needs an R2 token with Object Read & Write;
 * the certificate portal alone only ever needed read.
 */
export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  const response = await aws().fetch(objectUrl(key), {
    method: "PUT",
    body: new Blob([body as BlobPart], { type: contentType }),
    headers: { "Content-Type": contentType, "Content-Length": String(body.byteLength) },
  });
  if (!response.ok) throw new Error(`R2 PUT ${key} -> ${response.status}`);
}

export async function deleteObject(key: string): Promise<void> {
  const response = await aws().fetch(objectUrl(key), { method: "DELETE" });
  // 404 is fine: the goal is that it's gone.
  if (!response.ok && response.status !== 404) throw new Error(`R2 DELETE ${key} -> ${response.status}`);
}
