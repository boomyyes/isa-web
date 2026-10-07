// POST ref (form) -> writes the file as it was at that commit, as a new commit.
// Nothing is rewritten: history only ever grows, so a restore can itself be undone.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import { audit, hasCap } from "@/lib/admin/store";
import { collectionByName, collectionSchema } from "@/lib/content/collections";
import { ConflictError, readFile, toJsonText, writeFile } from "@/lib/content/github";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");

  const { name } = await params;
  const collection = collectionByName(name);
  if (!collection) return adminRedirect(request, "/content");
  if (!hasCap(session, "content")) return adminRedirect(request, "/?denied=1");

  const form = await request.formData().catch(() => null);
  const ref = form?.get("ref");
  if (typeof ref !== "string" || !/^[0-9a-f]{40}$/.test(ref)) {
    return adminRedirect(request, `/content/${name}?error=restore`);
  }

  try {
    const [old, current] = await Promise.all([readFile(collection.file, ref), readFile(collection.file)]);
    // Old versions must still pass today's rules, or the build would reject them.
    const oldData: unknown = JSON.parse(old.text);
    const parsed = collectionSchema(collection).safeParse(oldData);
    if (!parsed.success) return adminRedirect(request, `/content/${name}?error=restore-invalid`);

    const commit = await writeFile(
      collection.file,
      // Byte-for-byte the old version (keys in their original order), not the schema output.
      toJsonText(oldData),
      `content(${collection.name}): restore version ${ref.slice(0, 7)} — via admin`,
      current.sha
    );
    await audit(session.email, `restored ${collection.label} to ${ref.slice(0, 7)}`, commit.commitSha.slice(0, 7));
    return adminRedirect(request, `/content/${name}?restored=${commit.commitSha.slice(0, 7)}`);
  } catch (error) {
    const code = error instanceof ConflictError ? "conflict" : "restore";
    return adminRedirect(request, `/content/${name}?error=${code}`);
  }
}
