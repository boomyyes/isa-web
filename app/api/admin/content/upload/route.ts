// POST multipart { file, folder } -> commits an image to public/<folder>/ and
// returns its site path. The image goes live with the next deploy; the content
// change that uses it is published separately.

import { randomBytes } from "node:crypto";
import { sessionFrom } from "@/lib/admin/session";
import { audit, hasCap } from "@/lib/admin/store";
import { COLLECTIONS, type Field } from "@/lib/content/collections";
import { writeFile } from "@/lib/content/github";
import { sameOrigin } from "@/lib/security";
import { checkUpload } from "@/lib/uploads";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Only folders that an image field actually names, so uploads can't land anywhere else. */
function imageFolders(): Set<string> {
  const folders = new Set<string>();
  const walk = (fields: Field[]) => {
    for (const f of fields) {
      if (f.type === "image") folders.add(f.folder);
      if (f.type === "group" || f.type === "list") walk(f.fields);
    }
  };
  COLLECTIONS.forEach((c) => walk(c.fields));
  return folders;
}

/** "My Photo (1).JPG" -> "my-photo-1", so names stay readable in the repo. */
const slug = (name: string) =>
  name
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "image";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  const session = await sessionFrom(request);
  if (!session) return json({ error: "Your session has ended. Sign in again." }, 401);
  if (!hasCap(session, "content")) return json({ error: "You don't have permission to upload." }, 403);

  const form = await request.formData().catch(() => null);
  const folder = form?.get("folder");
  if (typeof folder !== "string" || !imageFolders().has(folder)) return json({ error: "Unknown folder." }, 400);

  const file = form?.get("file") ?? null;
  const upload = await checkUpload(file, ["png", "jpg", "webp"]);
  if ("error" in upload) return json({ error: upload.error }, 400);

  const original = file instanceof File ? file.name : "image";
  const name = `${slug(original)}-${randomBytes(3).toString("hex")}.${upload.type}`;
  const sitePath = `/${folder ? `${folder}/` : ""}${name}`;

  try {
    await writeFile(`public${sitePath}`, upload.bytes, `content(images): add ${sitePath} — via admin`);
    await audit(session.email, "uploaded an image", sitePath);
    return json({ ok: true, path: sitePath });
  } catch {
    return json({ error: "Upload failed. Try again shortly." }, 502);
  }
}
