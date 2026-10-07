import Link from "next/link";
import { AdminShell, buttonClass, cardClass, Notice } from "@/components/admin/AdminShell";
import { fieldClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";
import { canEdit, editMinutesLeft, getPost } from "@/lib/admin/forum";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireAdmin();
  const { base } = session;
  const { id } = await params;
  const { error } = await searchParams;
  const post = await getPost(id);
  const editable = post && canEdit(post, session.email);
  const minutesLeft = post ? editMinutesLeft(post) : 0;

  return (
    <AdminShell session={session} base={base} title="Edit post">
      {post && (
        <Link href={`${base}/forum/t/${post.threadId}`} className="text-sm text-[var(--accent-color)] underline underline-offset-2">Back to the thread</Link>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {!editable ? (
        <p className="text-sm text-[var(--text-secondary)]">
          This post can&apos;t be edited. Posts can be edited by their author for 15 minutes after posting.
        </p>
      ) : (
        <form method="post" action="/api/admin/forum" className={`${cardClass} grid gap-3`}>
          <input type="hidden" name="action" value="post-edit" />
          <input type="hidden" name="postId" value={post.id} />
          <textarea name="body" required rows={8} maxLength={10000} defaultValue={post.body} className={`${fieldClass} resize-y`} aria-label="Post" />
          <p className="text-xs text-[var(--text-secondary)]">About {minutesLeft} minute{minutesLeft === 1 ? "" : "s"} left to edit.</p>
          <div>
            <button className={buttonClass}>Save</button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
