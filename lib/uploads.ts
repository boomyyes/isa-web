// Shared upload checks for admin features (receipts, site images).
//
// The type is decided by the file's first bytes, never by its name or the
// browser's claimed MIME type, so a renamed executable is rejected.

import "server-only";
import { randomBytes } from "node:crypto";
import { putObject } from "@/lib/r2";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const UPLOAD_TYPES = {
  png: { mime: "image/png", magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  jpg: { mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  webp: { mime: "image/webp", magic: [0x52, 0x49, 0x46, 0x46] }, // "RIFF", plus "WEBP" at 8
  pdf: { mime: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46, 0x2d] }, // "%PDF-"
} as const;
export type UploadType = keyof typeof UPLOAD_TYPES;

export function sniffType(bytes: Uint8Array): UploadType | null {
  for (const [type, { magic }] of Object.entries(UPLOAD_TYPES) as [UploadType, (typeof UPLOAD_TYPES)[UploadType]][]) {
    if (!magic.every((b, i) => bytes[i] === b)) continue;
    if (type === "webp") {
      const tag = String.fromCharCode(...bytes.slice(8, 12));
      if (tag !== "WEBP") continue;
    }
    return type;
  }
  return null;
}

export type CheckedUpload = { bytes: Uint8Array; type: UploadType; mime: string };

/** Validates one file from a form. Returns a message for the person on failure. */
export async function checkUpload(
  file: FormDataEntryValue | null,
  allowed: readonly UploadType[]
): Promise<CheckedUpload | { error: string }> {
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Files must be 4 MB or smaller." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffType(bytes);
  if (!type || !allowed.includes(type)) {
    return { error: `Only ${allowed.map((t) => t.toUpperCase()).join(", ")} files are accepted.` };
  }
  return { bytes, type, mime: UPLOAD_TYPES[type].mime };
}

/** Stores under a random name in the private bucket. The original filename is discarded. */
export async function storePrivate(prefix: string, upload: CheckedUpload): Promise<string> {
  const key = `admin/${prefix}/${randomBytes(12).toString("hex")}.${upload.type}`;
  await putObject(key, upload.bytes, upload.mime);
  return key;
}
