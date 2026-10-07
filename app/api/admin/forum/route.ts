// POST action=… for the forum. Every admin can start threads and reply.
// Authors edit their own posts for 15 minutes and may delete their own.
// Moderators (owners, or the `forum` capability) pin, lock and delete anything.
// Categories are managed by owners.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import { audit, can, hasCap } from "@/lib/admin/store";
import {
  canEdit,
  categorySchema,
  createCategory,
  createThread,
  deleteCategory,
  deletePost,
  deleteThread,
  editPost,
  getCategory,
  getPost,
  getThread,
  isUuid,
  postSchema,
  reply,
  setThreadFlag,
  threadSchema,
  updateCategory,
} from "@/lib/admin/forum";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const err = (message: string) => `error=${encodeURIComponent(message)}`;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");

  const form = await request.formData().catch(() => null);
  const get = (k: string) => form?.get(k) ?? undefined;
  const action = get("action");
  const moderator = hasCap(session, "forum");
  const owner = can(session.role, "owner");

  // ---------------------------------------------------------- categories
  if (action === "category-save" || action === "category-delete") {
    if (!owner) return adminRedirect(request, `/forum?${err("Only owners can manage categories.")}`);
    const id = get("id");
    if (action === "category-delete") {
      if (!isUuid(id) || !(await getCategory(id))) return adminRedirect(request, `/forum?${err("That category no longer exists.")}`);
      if ((await deleteCategory(id)) === "not-empty") {
        return adminRedirect(request, `/forum?${err("Only empty categories can be deleted. Move or delete its threads first.")}`);
      }
      await audit(session.email, "deleted a forum category");
      return adminRedirect(request, "/forum?saved=1");
    }
    const parsed = categorySchema.safeParse({ name: get("name"), description: get("description"), position: get("position") ?? 0 });
    if (!parsed.success) return adminRedirect(request, `/forum?${err(parsed.error.issues[0].message)}`);
    if (isUuid(id)) await updateCategory(id, parsed.data);
    else await createCategory(parsed.data);
    await audit(session.email, `saved forum category "${parsed.data.name}"`);
    return adminRedirect(request, "/forum?saved=1");
  }

  // ------------------------------------------------------------- threads
  if (action === "thread-create") {
    const categoryId = get("categoryId");
    if (!isUuid(categoryId) || !(await getCategory(categoryId))) return adminRedirect(request, `/forum?${err("That category no longer exists.")}`);
    const parsed = threadSchema.safeParse({ title: get("title"), body: get("body") });
    if (!parsed.success) return adminRedirect(request, `/forum/c/${categoryId}?${err(parsed.error.issues[0].message)}`);
    const id = await createThread(categoryId, parsed.data, session.email);
    return adminRedirect(request, `/forum/t/${id}`);
  }

  const threadId = get("threadId");
  const thread = isUuid(threadId) ? await getThread(threadId) : null;

  if (action === "reply") {
    if (!thread) return adminRedirect(request, `/forum?${err("That thread no longer exists.")}`);
    if (thread.locked && !moderator) return adminRedirect(request, `/forum/t/${thread.id}?${err("This thread is locked.")}`);
    const parsed = postSchema.safeParse({ body: get("body") });
    if (!parsed.success) return adminRedirect(request, `/forum/t/${thread.id}?${err(parsed.error.issues[0].message)}`);
    await reply(thread.id, parsed.data.body, session.email);
    return adminRedirect(request, `/forum/t/${thread.id}?page=last#latest`);
  }

  if (action === "thread-pin" || action === "thread-lock" || action === "thread-delete") {
    if (!thread) return adminRedirect(request, `/forum?${err("That thread no longer exists.")}`);
    if (!moderator) return adminRedirect(request, `/forum/t/${thread.id}?${err("Only moderators can do that.")}`);
    if (action === "thread-delete") {
      await deleteThread(thread.id);
      await audit(session.email, `deleted forum thread "${thread.title}"`);
      return adminRedirect(request, `/forum/c/${thread.categoryId}?saved=deleted`);
    }
    const flag = action === "thread-pin" ? "pinned" : "locked";
    const value = !thread[flag];
    await setThreadFlag(thread.id, flag, value);
    await audit(session.email, `${value ? "" : "un"}${flag === "pinned" ? "pinned" : "locked"} forum thread "${thread.title}"`);
    return adminRedirect(request, `/forum/t/${thread.id}`);
  }

  // --------------------------------------------------------------- posts
  if (action === "post-edit" || action === "post-delete") {
    const postId = get("postId");
    const post = isUuid(postId) ? await getPost(postId) : null;
    const parent = post ? await getThread(post.threadId) : null;
    if (!post || !parent || post.deletedAt) return adminRedirect(request, `/forum?${err("That post no longer exists.")}`);

    if (action === "post-delete") {
      if (post.createdBy !== session.email && !moderator) {
        return adminRedirect(request, `/forum/t/${parent.id}?${err("You can only delete your own posts.")}`);
      }
      await deletePost(post.id, session.email);
      if (post.createdBy !== session.email) await audit(session.email, `removed a post by ${post.createdBy}`, parent.title);
      return adminRedirect(request, `/forum/t/${parent.id}`);
    }

    if (!canEdit(post, session.email)) {
      return adminRedirect(request, `/forum/t/${parent.id}?${err("Posts can only be edited by their author, within 15 minutes.")}`);
    }
    const parsed = postSchema.safeParse({ body: get("body") });
    if (!parsed.success) return adminRedirect(request, `/forum/p/${post.id}?${err(parsed.error.issues[0].message)}`);
    await editPost(post.id, parsed.data.body);
    return adminRedirect(request, `/forum/t/${parent.id}`);
  }

  return adminRedirect(request, "/forum");
}
