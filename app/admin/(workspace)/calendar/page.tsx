import Link from "next/link";
import { AdminShell, buttonClass, cardClass, Notice } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/session";
import { hasCap } from "@/lib/admin/store";
import { itemsBetween } from "@/lib/admin/calendar";
import { dbConfigured } from "@/lib/db";
import type { CalendarItem } from "@/lib/calendar";

export const dynamic = "force-dynamic";

const KIND_STYLE: Record<CalendarItem["kind"], string> = {
  internal: "border-l-[var(--accent-color)] bg-[var(--accent-color)]/10",
  upcoming: "border-l-[var(--border-active)] bg-[var(--border-active)]/10",
  past: "border-l-[var(--text-secondary)] bg-[var(--text-secondary)]/10",
};
const KIND_LABEL: Record<CalendarItem["kind"], string> = {
  internal: "Internal",
  upcoming: "Public · upcoming",
  past: "Public · held",
};

/** Today's date in India, as "YYYY-MM-DD". */
const todayIst = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));

/** Does an item fall on this day (counting multi-day spans)? */
const onDay = (item: CalendarItem, day: string) =>
  item.date === day || (item.endDate !== undefined && item.date <= day && day <= item.endDate);

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; saved?: string; error?: string }>;
}) {
  const session = await requireAdmin();
  const { base } = session;
  const { m, saved, error } = await searchParams;
  const canEdit = hasCap(session, "events");

  const today = todayIst();
  const [year, mon] = (/^\d{4}-\d{2}$/.test(m ?? "") ? m! : today.slice(0, 7)).split("-").map(Number);
  const first = new Date(Date.UTC(year, mon - 1, 1));
  const last = new Date(Date.UTC(year, mon, 0));
  // Grid runs Monday to Sunday, padded to whole weeks.
  const gridStart = addDays(first, -((first.getUTCDay() + 6) % 7));
  const gridEnd = addDays(last, 6 - ((last.getUTCDay() + 6) % 7));
  const days: string[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(iso(d));

  const monthKey = (d: Date) => iso(d).slice(0, 7);
  const prev = monthKey(new Date(Date.UTC(year, mon - 2, 1)));
  const next = monthKey(new Date(Date.UTC(year, mon, 1)));
  const title = first.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

  if (!dbConfigured()) {
    return (
      <AdminShell session={session} base={base} title="Calendar">
        <Notice tone="error">The calendar needs DATABASE_URL on this deployment.</Notice>
      </AdminShell>
    );
  }
  const items = await itemsBetween(days[0], days[days.length - 1]);
  const inMonth = items.filter((i) => i.date.slice(0, 7) === monthKey(first) || (i.endDate ?? i.date).slice(0, 7) === monthKey(first));

  return (
    <AdminShell session={session} base={base} title="Calendar">
      {saved === "1" && <Notice>Saved.</Notice>}
      {saved === "deleted" && <Notice>Deleted.</Notice>}
      {error === "denied" && <Notice tone="error">You don&apos;t have permission to change the calendar.</Notice>}
      {error === "missing" && <Notice tone="error">That event no longer exists.</Notice>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`${base}/calendar?m=${prev}`} className={`${buttonClass} !px-3`} aria-label="Previous month">←</Link>
          <h2 className="min-w-44 text-center font-jetbrains text-lg font-bold text-[var(--text-primary)]">{title}</h2>
          <Link href={`${base}/calendar?m=${next}`} className={`${buttonClass} !px-3`} aria-label="Next month">→</Link>
          <Link href={`${base}/calendar`} className="ml-2 text-sm text-[var(--accent-color)] underline underline-offset-2">Today</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && <Link href={`${base}/calendar/new`} className={buttonClass}>Add internal event</Link>}
          {hasCap(session, "content") && (
            <Link href={`${base}/content/upcoming-events`} className={buttonClass}>Add public event</Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
        {(Object.keys(KIND_LABEL) as CalendarItem["kind"][]).map((k) => (
          <span key={k} className={`border-l-4 px-2 py-0.5 ${KIND_STYLE[k]}`}>{KIND_LABEL[k]}</span>
        ))}
      </div>

      {/* Month grid: from md up. On phones the agenda below is the calendar. */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--border-color)] md:block">
        <div className="grid grid-cols-7 bg-[var(--card-color)] font-jetbrains text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-2 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayItems = items.filter((i) => onDay(i, day));
            const outside = day.slice(0, 7) !== monthKey(first);
            return (
              <div
                key={day}
                className={`min-h-28 border-t border-r border-[var(--border-color)] p-1.5 ${outside ? "opacity-40" : ""} ${day === today ? "bg-[var(--border-active)]/5" : ""}`}
              >
                <p className={`text-right text-xs ${day === today ? "font-bold text-[var(--border-active)]" : "text-[var(--text-secondary)]"}`}>
                  {Number(day.slice(8))}
                </p>
                <ul className="mt-1 space-y-1">
                  {dayItems.slice(0, 3).map((i) => (
                    <li key={i.id} className={`truncate border-l-4 px-1.5 py-0.5 text-[11px] text-[var(--text-primary)] ${KIND_STYLE[i.kind]}`} title={i.title}>
                      {i.kind === "internal" ? (
                        <Link href={`${base}/calendar/e/${i.id}`}>{i.startTime ? `${i.startTime} ` : ""}{i.title}</Link>
                      ) : (
                        i.title
                      )}
                    </li>
                  ))}
                  {dayItems.length > 3 && <li className="text-[11px] text-[var(--text-secondary)]">+{dayItems.length - 3} more</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <section className={cardClass}>
        <h2 className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">This month</h2>
        {inMonth.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Nothing scheduled.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border-color)]">
            {inMonth.map((i) => (
              <li key={i.id} className={`flex flex-wrap items-baseline justify-between gap-2 border-l-4 py-3 pl-3 ${KIND_STYLE[i.kind]}`}>
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-primary)]">
                    {i.kind === "internal" ? (
                      <Link href={`${base}/calendar/e/${i.id}`} className="underline underline-offset-2">{i.title}</Link>
                    ) : (
                      i.title
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {new Date(`${i.date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}
                    {i.endDate && i.endDate !== i.date && ` – ${new Date(`${i.endDate}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}`}
                    {i.startTime && ` · ${i.startTime}${i.endTime ? `–${i.endTime}` : ""}`}
                    {i.location && ` · ${i.location}`}
                    {` · ${KIND_LABEL[i.kind]}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-[var(--text-secondary)]">
        Public events come from Website content: upcoming events appear once they have a start date. The
        public feed for subscribers is <code className="font-jetbrains">https://www.isarait.in/events.ics</code>;
        internal events are never in it.
      </p>
    </AdminShell>
  );
}
