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

/**
 * Roster rows claim a `cert` key as soon as attendance is marked, so the image
 * may not be uploaded yet. HEAD is a cheap Class-B op; check before redirecting.
 */
export async function objectExists(key: string): Promise<boolean> {
  const response = await aws().fetch(objectUrl(key), { method: "HEAD" });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`R2 HEAD ${key} -> ${response.status}`);
  return true;
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
