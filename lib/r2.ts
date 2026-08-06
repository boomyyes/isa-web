// Presigned reads for the private Cloudflare R2 certificate bucket.
//
// The bucket has no public access. Every object read goes through a presigned
// URL minted here *after* an eligibility check, and that URL expires in a couple
// of minutes. Redirecting the browser straight to R2 (rather than proxying the
// bytes the way /api/isaac-cover does) keeps the download off the Next host
// entirely — no serverless bandwidth burned, and R2 egress is free.
//
// aws4fetch is used instead of @aws-sdk/client-s3: it is a few KB, has no
// dependencies, and SigV4 query signing is all we need here.

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
 * A time-limited GET URL for one object.
 *
 * @param key           R2 object key, e.g. "wks-1/121.png"
 * @param ttlSeconds    How long the URL stays valid
 * @param downloadName  Filename the browser should save as. Signed into the
 *                      request, so it cannot be tampered with after the fact.
 */
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
