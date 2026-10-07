import Link from "next/link";
import { AdminShell, buttonClass, cardClass, dangerButtonClass, formatTime, Notice } from "@/components/admin/AdminShell";
import { PlainText } from "@/components/admin/PlainText";
import { fieldClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";
import { hasCap } from "@/lib/admin/store";
import { canEdit, getCategory, getThread, listPosts, POSTS_PER_PAGE } from "@/lib/admin/forum";

export const dynamic = "force-dynamic";

const small = "!px-3 !py-1.5";

export default async function ForumThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; error?: string }>;
}) {
  const session = await requireAdmin();
  const { base } = session;
  const { id } = await params;
  const { page: rawPage, error } = await searchParams;
  const thread = await getThread(id);

  if (!thread) {
    return (
      <AdminShell session={session} base={base} title="Not found">
        <p className="text-sm text-[var(--text-secondary)]">That thread doesn&apos;t exist or was deleted.</p>
        <Link href={`${base}/forum`} className="text-sm text-[var(--accent-color)] underline">Back to the forum</Link>
      </AdminShell>
    );
  }

  const moderator = hasCap(session, "forum");
  const total = thread.replyCount + 1;
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const page = rawPage === "last" ? pages : Math.min(pages, Math.max(1, Number(rawPage) || 1));
  const [category, { rows }] = await Promise.all([getCategory(thread.categoryId), listPosts(thread.id, page)]);

  return (
    <AdminShell session={session} base={base} title={thread.title}>
      <Link href={`${base}/forum/c/${thread.categoryId}`} className="text-sm text-[var(--accent-color)] underline underline-offset-2">
        {category?.name ?? "Back"}
      </Link>
      {error && <Notice tone="error">{error}</Notice>}
      {(thread.pinned || thread.locked) && (
        <p className="text-xs text-[var(--text-secondary)]">
          {thread.pinned && "Pinned. "}
          {thread.locked && "Locked: only moderators can reply."}
        </p>
      )}

      {moderator && (
        <div className="flex flex-wrap gap-2">
          {(["thread-pin", "thread-lock"] as const).map((action) => (
            <form key={action} method="post" action="/api/admin/forum">
              <input type="hidden" name="action" value={action} />
              <input type="hidden" name="threadId" value={thread.id} />
              <button className={`${buttonClass} ${small}`}>
                {action === "thread-pin" ? (thread.pinned ? "Unpin" : "Pin") : thread.locked ? "Unlock" : "Lock"}
              </button>
            </form>
          ))}
          <form method="post" action="/api/admin/forum">
            <input type="hidden" name="action" value="thread-delete" />
            <input type="hidden" name="threadId" value={thread.id} />
            <button className={`${dangerButtonClass} ${small}`}>Delete thread</button>
          </form>
        </div>
      )}

      <ol className="space-y-4">
        {rows.map((p, i) => {
          const last = i === rows.length - 1 && page === pages;
          return (
            <li key={p.id} id={last ? "latest" : undefined} className={cardClass}>
              {p.deletedAt ? (
                <p className="text-sm italic text-[var(--text-secondary)]">
                  Post removed{p.deletedBy && p.deletedBy !== p.createdBy ? " by a moderator" : " by its author"}.
                </p>
              ) : (
                <PlainText text={p.body} className="text-sm leading-relaxed text-[var(--text-primary)]" />
              )}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[var(--text-secondary)]">
                  {p.createdBy} · {formatTime(p.createdAt.toISOString())}
                  {p.editedAt && " · edited"}
                </p>
                {!p.deletedAt && (
                  <div className="flex gap-3 text-xs">
                    {canEdit(p, session.email) && (
                      <Link href={`${base}/forum/p/${p.id}`} className="text-[var(--accent-color)] underline">Edit</Link>
                    )}
                    {(p.createdBy === session.email || moderator) && (
                      <form method="post" action="/api/admin/forum">
                        <input type="hidden" name="action" value="post-delete" />
                        <input type="hidden" name="postId" value={p.id} />
                        <button className="text-red-400 underline">Delete</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {pages > 1 && (
        <nav className="flex items-center gap-3 text-sm" aria-label="Pages">
          {page > 1 && <Link href={`${base}/forum/t/${thread.id}?page=${page - 1}`} className="underline">Earlier</Link>}
          <span className="text-[var(--text-secondary)]">Page {page} of {pages}</span>
          {page < pages && <Link href={`${base}/forum/t/${thread.id}?page=${page + 1}`} className="underline">Later</Link>}
        </nav>
      )}

      {!thread.locked || moderator ? (
        <form method="post" action="/api/admin/forum" className={`${cardClass} grid gap-3`}>
          <input type="hidden" name="action" value="reply" />
          <input type="hidden" name="threadId" value={thread.id} />
          <label htmlFor="reply" className="sr-only">Reply</label>
          <textarea id="reply" name="body" required rows={4} maxLength={10000} placeholder="Write a reply" className={`${fieldClass} resize-y`} />
          <div>
            <button className={buttonClass}>Reply</button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">This thread is locked.</p>
      )}
    </AdminShell>
  );
}
