import Link from "next/link";
import { AdminShell, cardClass, dangerButtonClass, formatTime, Notice } from "@/components/admin/AdminShell";
import { CalendarEventForm } from "@/components/admin/CalendarEventForm";
import { requireAdmin } from "@/lib/admin/session";
import { hasCap } from "@/lib/admin/store";
import { getInternal } from "@/lib/admin/calendar";

export const dynamic = "force-dynamic";

export default async function CalendarEventPage({
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
  const event = await getInternal(id);
  const canEdit = hasCap(session, "events");

  if (!event) {
    return (
      <AdminShell session={session} base={base} title="Not found">
        <Link href={`${base}/calendar`} className="text-sm text-[var(--accent-color)] underline">Back to calendar</Link>
      </AdminShell>
    );
  }

  return (
    <AdminShell session={session} base={base} title={event.title}>
      <Link href={`${base}/calendar?m=${event.date.slice(0, 7)}`} className="text-sm text-[var(--accent-color)] underline underline-offset-2">
        Back to calendar
      </Link>
      {error && <Notice tone="error">{error}</Notice>}
      <p className="text-xs text-[var(--text-secondary)]">
        Added by {event.createdBy}, {formatTime(event.createdAt.toISOString())}
      </p>

      {canEdit ? (
        <>
          <CalendarEventForm mode="update" values={event} />
          <form method="post" action="/api/admin/calendar" className={cardClass}>
            <input type="hidden" name="action" value="delete" />
            <input type="hidden" name="id" value={event.id} />
            <button className={dangerButtonClass}>Delete event</button>
          </form>
        </>
      ) : (
        <dl className={`${cardClass} grid gap-3 text-sm sm:grid-cols-[8rem_1fr]`}>
          <dt className="text-[var(--text-secondary)]">When</dt>
          <dd className="text-[var(--text-primary)]">
            {event.date}
            {event.endDate && ` – ${event.endDate}`}
            {event.startTime && ` · ${event.startTime}${event.endTime ? `–${event.endTime}` : ""}`}
          </dd>
          {event.location && (
            <>
              <dt className="text-[var(--text-secondary)]">Where</dt>
              <dd className="text-[var(--text-primary)]">{event.location}</dd>
            </>
          )}
          {event.notes && (
            <>
              <dt className="text-[var(--text-secondary)]">Notes</dt>
              <dd className="whitespace-pre-wrap text-[var(--text-primary)]">{event.notes}</dd>
            </>
          )}
        </dl>
      )}
    </AdminShell>
  );
}
