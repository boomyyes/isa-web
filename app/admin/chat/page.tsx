import Link from "next/link";
import { AdminShell, buttonClass, cardClass, Notice } from "@/components/admin/AdminShell";
import { ChatRoom } from "@/components/admin/ChatRoom";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireCapability } from "@/lib/admin/session";
import { AUDIENCES, audienceLabel, can, hasCap, seesDomain } from "@/lib/admin/store";
import { listChannels } from "@/lib/admin/chat";
import { ablyConfigured } from "@/lib/ably";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; saved?: string; error?: string }>;
}) {
  const session = await requireCapability("chat");
  const { base } = session;
  const { c, saved, error } = await searchParams;
  const owner = can(session.role, "president");
  const channels = (await listChannels({ includeArchived: true })).filter((ch) => seesDomain(session, ch.domain));
  const active = channels.filter((ch) => !ch.archived);
  const current = channels.find((ch) => ch.id === c) ?? active[0];

  return (
    <AdminShell session={session} base={base} title={current ? `# ${current.name}` : "Chat"}>
      {saved && <Notice>Saved.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {!ablyConfigured() && (
        <Notice tone="error">Live updates aren&apos;t set up (ABLY_API_KEY is missing); chat still works, refreshing every 20 seconds.</Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[12rem_1fr]">
        <nav aria-label="Channels" className="space-y-1">
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={`${base}/chat?c=${ch.id}`}
              className={`block truncate rounded-lg px-3 py-1.5 text-sm ${ch.id === current?.id ? "bg-[var(--border-active)]/15 text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"} ${ch.archived ? "italic opacity-60" : ""}`}
            >
              # {ch.name}
            </Link>
          ))}
          {channels.length === 0 && <p className="text-sm text-[var(--text-secondary)]">No channels yet.</p>}
        </nav>

        <div className="min-w-0 space-y-3">
          {current?.description && <p className="text-sm text-[var(--text-secondary)]">{current.description}</p>}
          {current ? (
            // Keyed so switching channels starts a fresh connection and history.
            <ChatRoom key={current.id} channelId={current.id} me={session.email} canModerate={hasCap(session, "forum")} archived={current.archived} />
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">{owner ? "Create the first channel below." : "Faculty, the President or Admin need to create a channel."}</p>
          )}
        </div>
      </div>

      {owner && (
        <details className={cardClass}>
          <summary className="cursor-pointer font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Manage channels</summary>
          <div className="mt-4 space-y-4">
            {[...channels, { id: "", name: "", description: null, domain: null, position: channels.length, archived: false }].map((ch) => (
              <div key={ch.id || "new"} className="flex flex-wrap items-end gap-3 border-t border-[var(--border-color)] pt-4">
                <form method="post" action="/api/admin/chat/channels" className="grid flex-1 gap-3 sm:grid-cols-[1fr_2fr_9rem_5rem_auto] sm:items-end">
                  <input type="hidden" name="action" value="save" />
                  {ch.id && <input type="hidden" name="id" value={ch.id} />}
                  <div>
                    <label className={labelClass}>{ch.id ? "Name" : "New channel"}</label>
                    <input name="name" required maxLength={60} defaultValue={ch.name} aria-label="Channel name" className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <input name="description" maxLength={200} defaultValue={ch.description ?? ""} aria-label="Channel description" className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Visible to</label>
                    <select name="domain" defaultValue={ch.domain ?? ""} aria-label="Visible to" className={fieldClass}>
                      <option value="">Everyone</option>
                      {AUDIENCES.map((a) => (
                        <option key={a} value={a}>{audienceLabel(a)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Order</label>
                    <input name="position" type="number" min={0} max={999} defaultValue={ch.position} aria-label="Order" className={fieldClass} />
                  </div>
                  <button className={buttonClass}>{ch.id ? "Save" : "Add"}</button>
                </form>
                {ch.id && (
                  <form method="post" action="/api/admin/chat/channels">
                    <input type="hidden" name="action" value={ch.archived ? "unarchive" : "archive"} />
                    <input type="hidden" name="id" value={ch.id} />
                    <button className={`${buttonClass} !px-3`}>{ch.archived ? "Unarchive" : "Archive"}</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </AdminShell>
  );
}
