"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import * as Ably from "ably";
import { Loader2, Send, Trash2 } from "lucide-react";
import { PlainText } from "@/components/admin/PlainText";
import { fieldClass } from "@/components/ui/formStyles";

type Message = { id: string; body: string; createdBy: string; createdAt: string; deleted: boolean };

const MAX = 2000;
/** If live updates are down, how often to check anyway. */
const POLL_MS = 20_000;

const time = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Merge by id, keep oldest first. Later copies (e.g. a deletion) win. */
function merge(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function ChatRoom({
  channelId,
  me,
  canModerate,
  archived,
}: {
  channelId: string;
  me: string;
  canModerate: boolean;
  archived: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [live, setLive] = useState<"connecting" | "live" | "offline">("connecting");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const latest = useRef<string | null>(null);
  const stickToBottom = useRef(true);

  const api = useCallback(
    async (params: Record<string, string>) => {
      const res = await fetch(`/api/admin/chat/messages?${new URLSearchParams({ channel: channelId, ...params })}`, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status === 401 ? "Your session has ended. Reload to sign in." : "Couldn't load messages.");
      return ((await res.json()) as { messages: Message[] }).messages;
    },
    [channelId]
  );

  /** Newest page: on open, and after a deletion (which can't be caught by "after"). */
  const refreshLatest = useCallback(async () => {
    try {
      const page = await api({});
      setMessages((cur) => merge(cur, page));
      if (page.length) latest.current = page[page.length - 1].createdAt;
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api]);

  const catchUp = useCallback(async () => {
    if (!latest.current) return refreshLatest();
    try {
      const fresh = await api({ after: latest.current });
      if (fresh.length) {
        latest.current = fresh[fresh.length - 1].createdAt;
        setMessages((cur) => merge(cur, fresh));
      }
    } catch {
      // The next signal or poll will try again.
    }
  }, [api, refreshLatest]);

  // Initial load, live subscription, and a polling fallback.
  useEffect(() => {
    let closed = false;
    // Deferred so no state is set synchronously inside the effect.
    queueMicrotask(() => void refreshLatest());

    let realtime: Ably.Realtime | null = null;
    try {
      realtime = new Ably.Realtime({ authUrl: "/api/admin/chat/token", authMethod: "GET", autoConnect: true });
      realtime.connection.on((change) => {
        if (closed) return;
        setLive(change.current === "connected" ? "live" : change.current === "connecting" ? "connecting" : "offline");
        // Whatever was missed while disconnected.
        if (change.current === "connected") catchUp();
      });
      const channel = realtime.channels.get(`chat:${channelId}`);
      channel.subscribe("new", () => catchUp());
      channel.subscribe("deleted", () => refreshLatest());
    } catch {
      queueMicrotask(() => setLive("offline"));
    }

    const poll = setInterval(() => {
      if (document.visibilityState === "visible") catchUp();
    }, POLL_MS);

    return () => {
      closed = true;
      clearInterval(poll);
      realtime?.close();
    };
  }, [channelId, catchUp, refreshLatest]);

  // Follow new messages only if the reader is already at the bottom.
  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function loadOlder() {
    const first = messages[0];
    if (!first) return;
    const el = listRef.current;
    const before = el?.scrollHeight ?? 0;
    try {
      const older = await api({ before: first.createdAt });
      if (older.length === 0) setHasOlder(false);
      stickToBottom.current = false;
      setMessages((cur) => merge(cur, older));
      // Keep the reader's place instead of jumping.
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - before;
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, body }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: Message; error?: string };
      if (!res.ok || !data.message) throw new Error(data.error ?? "Couldn't send.");
      stickToBottom.current = true;
      setMessages((cur) => merge(cur, [data.message!]));
      if (!latest.current || data.message.createdAt > latest.current) latest.current = data.message.createdAt;
      setDraft("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this message?")) return;
    const res = await fetch("/api/admin/chat/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setMessages((cur) => cur.map((m) => (m.id === id ? { ...m, deleted: true, body: "" } : m)));
    else setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn't delete.");
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter is a new line.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-[70vh] min-h-[420px] flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/40">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-2 text-xs text-[var(--text-secondary)]">
        <span>
          <span
            className={`mr-1.5 inline-block h-2 w-2 rounded-full ${live === "live" ? "bg-emerald-500" : live === "connecting" ? "bg-amber-500" : "bg-red-500"}`}
          />
          {live === "live" ? "Live" : live === "connecting" ? "Connecting…" : "Live updates unavailable, checking every 20 seconds"}
        </span>
        <span>Messages are deleted after a year.</span>
      </div>

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 space-y-3 overflow-y-auto p-4"
        aria-live="polite"
      >
        {hasOlder && messages.length >= 50 && (
          <button type="button" onClick={loadOlder} className="mx-auto block text-xs text-[var(--accent-color)] underline">
            Load earlier messages
          </button>
        )}
        {messages.length === 0 && <p className="text-center text-sm text-[var(--text-secondary)]">No messages yet. Say hello.</p>}
        {messages.map((m) => {
          const mine = m.createdBy === me;
          return (
            <div key={m.id} className={`group max-w-[85%] ${mine ? "ml-auto text-right" : ""}`}>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {mine ? "You" : m.createdBy} · {time(m.createdAt)}
              </p>
              <div
                className={`mt-0.5 inline-block rounded-2xl px-3 py-2 text-left text-sm ${mine ? "bg-[var(--border-active)]/15" : "bg-[var(--card-color)]"} text-[var(--text-primary)]`}
              >
                {m.deleted ? <span className="italic text-[var(--text-secondary)]">Message deleted</span> : <PlainText text={m.body} />}
              </div>
              {!m.deleted && (mine || canModerate) && (
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="ml-1 align-top text-[var(--text-secondary)] opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                  aria-label="Delete message"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p role="alert" className="px-4 pb-1 text-xs text-red-400">{error}</p>}

      {archived ? (
        <p className="border-t border-[var(--border-color)] p-4 text-sm text-[var(--text-secondary)]">This channel is archived and read-only.</p>
      ) : (
        <form onSubmit={send} className="flex items-end gap-2 border-t border-[var(--border-color)] p-3">
          <label htmlFor="chat-draft" className="sr-only">Message</label>
          <textarea
            id="chat-draft"
            rows={2}
            maxLength={MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder="Message (Enter to send, Shift+Enter for a new line)"
            className={`${fieldClass} resize-none`}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border-active)] bg-[var(--border-active)]/10 text-[var(--text-primary)] disabled:opacity-40"
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      )}
    </div>
  );
}
