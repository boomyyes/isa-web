"use client";

import { useState } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { ImageField } from "@/components/admin/ContentEditor";

type Upcoming = { id: string; title: string; when: string; start?: string };

const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] transition hover:border-[var(--border-active)] hover:text-[var(--text-primary)] disabled:opacity-40";
const primary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-active)] bg-[var(--border-active)]/10 px-4 py-2.5 font-jetbrains text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)] transition hover:bg-[var(--border-active)]/20 disabled:opacity-50";

/**
 * "This event has happened": collects what only a held event has, then moves it
 * from upcoming to the archive in one commit. Lives beside the upcoming-events
 * editor rather than inside it, and works on the published files, so unsaved
 * edits in the editor above are not part of the move.
 */
export function MoveEventPanel({
  items,
  upcomingSha,
  eventsSha,
  tenures,
  eventTypes,
}: {
  items: Upcoming[];
  upcomingSha: string;
  eventsSha: string;
  tenures: { id: string; label: string }[];
  eventTypes: string[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">No upcoming events to move.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--card-color)]/40">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--text-primary)]">{item.title}</p>
              <p className="text-xs text-[var(--text-secondary)]">{item.when}</p>
            </div>
            <button type="button" className={btn} onClick={() => setOpen(open === item.id ? null : item.id)}>
              <ArrowRightLeft className="h-3.5 w-3.5" />
              {open === item.id ? "Cancel" : "Move to past events"}
            </button>
          </div>
          {open === item.id && (
            <MoveForm item={item} upcomingSha={upcomingSha} eventsSha={eventsSha} tenures={tenures} />
          )}
        </li>
      ))}
      <datalist id="event-types">
        {eventTypes.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </ul>
  );
}

function MoveForm({
  item,
  upcomingSha,
  eventsSha,
  tenures,
}: {
  item: Upcoming;
  upcomingSha: string;
  eventsSha: string;
  tenures: { id: string; label: string }[];
}) {
  const [details, setDetails] = useState({
    date: item.start ?? "",
    type: "",
    venue: "",
    tenure: tenures[0]?.id ?? "",
    image: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<{ kind: "idle" | "busy" } | { kind: "done"; url: string } | { kind: "error"; message: string }>({ kind: "idle" });
  const set = (key: keyof typeof details, value: string) => setDetails((d) => ({ ...d, [key]: value }));

  async function move() {
    const missing: Record<string, string> = {};
    if (!details.date) missing.date = "Enter the date it was held.";
    if (!details.type.trim()) missing.type = "Enter the type.";
    if (!details.venue.trim()) missing.venue = "Enter the venue.";
    if (!details.tenure) missing.tenure = "Choose a tenure.";
    setErrors(missing);
    if (Object.keys(missing).length) return;

    setState({ kind: "busy" });
    try {
      const response = await fetch("/api/admin/content/move-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, upcomingSha, eventsSha, details }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        commitUrl?: string;
        error?: string;
        issues?: { path: string; message: string }[];
      };
      if (response.ok && body.commitUrl) {
        setState({ kind: "done", url: body.commitUrl });
        // The editor above holds the old files; reload so both show the move.
        setTimeout(() => window.location.reload(), 1800);
        return;
      }
      if (body.issues) setErrors(Object.fromEntries(body.issues.map((i) => [i.path, i.message])));
      setState({ kind: "error", message: body.error ?? "Moving failed." });
    } catch {
      setState({ kind: "error", message: "Couldn't reach the server. Nothing was changed." });
    }
  }

  const err = (k: string) => (errors[k] ? <p className="mt-1 text-xs text-red-400">{errors[k]}</p> : null);

  return (
    <div className="space-y-4 border-t border-[var(--border-color)] p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${item.id}-date`} className={labelClass}>Date held (first day) *</label>
          <input id={`${item.id}-date`} type="date" value={details.date} onChange={(e) => set("date", e.target.value)} className={fieldClass} />
          {err("date")}
        </div>
        <div>
          <label htmlFor={`${item.id}-tenure`} className={labelClass}>Tenure *</label>
          <select id={`${item.id}-tenure`} value={details.tenure} onChange={(e) => set("tenure", e.target.value)} className={`${fieldClass} w-auto`}>
            {tenures.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          {err("tenure")}
        </div>
        <div>
          <label htmlFor={`${item.id}-type`} className={labelClass}>Type *</label>
          <input id={`${item.id}-type`} list="event-types" value={details.type} onChange={(e) => set("type", e.target.value)} placeholder="Workshop" className={fieldClass} />
          {err("type")}
        </div>
        <div>
          <label htmlFor={`${item.id}-venue`} className={labelClass}>Venue *</label>
          <input id={`${item.id}-venue`} value={details.venue} onChange={(e) => set("venue", e.target.value)} placeholder="RAIT" className={fieldClass} />
          {err("venue")}
        </div>
      </div>
      <ImageField
        field={{ key: "image", label: "Photo", type: "image", folder: "events" }}
        id={`${item.id}-image`}
        value={details.image}
        path={["image"]}
        update={(_, v) => set("image", String(v ?? ""))}
        label={<label htmlFor={`${item.id}-image`} className={labelClass}>Photo</label>}
        help={null}
        err={err("image")}
      />
      <div>
        <label htmlFor={`${item.id}-desc`} className={labelClass}>Recap</label>
        <textarea id={`${item.id}-desc`} rows={4} value={details.description} onChange={(e) => set("description", e.target.value)} className={`${fieldClass} resize-y`} />
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Optional now; you can add it later under Past events.</p>
      </div>

      {state.kind === "done" && (
        <p className="text-sm text-[var(--text-primary)]">
          Moved. The site updates in about 2 minutes.{" "}
          <a href={state.url} target="_blank" rel="noreferrer" className="text-[var(--accent-color)] underline">View the commit</a>
        </p>
      )}
      {state.kind === "error" && <p role="alert" className="text-sm text-red-400">{state.message}</p>}

      <button type="button" className={primary} disabled={state.kind === "busy" || state.kind === "done"} onClick={move}>
        {state.kind === "busy" && <Loader2 className="h-4 w-4 animate-spin" />}
        Move &ldquo;{item.title}&rdquo; to past events
      </button>
    </div>
  );
}
