import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  AdminShell,
  buttonClass,
  cardClass,
  formatTime,
  Notice,
  pillActiveClass,
  pillClass,
} from "@/components/admin/AdminShell";
import { CashChart, type CashPoint } from "@/components/admin/CashChart";
import { unreadCount } from "@/lib/admin/announcements";
import { itemsBetween } from "@/lib/admin/calendar";
import { budgetSummary, countBills, formatPaise, listLedger } from "@/lib/admin/finance";
import { requireAdmin } from "@/lib/admin/session";
import { hasAnyCap, hasCap } from "@/lib/admin/store";
import { listSubmissions } from "@/lib/admin/submissions";
import { dbConfigured } from "@/lib/db";
import { FORMS } from "@/lib/forms/schemas";
import { cn } from "@/lib/utils";
import { shownValue } from "@/lib/forms/sheet";

export const dynamic = "force-dynamic";

const RANGES = { "1M": 30, "3M": 91, "6M": 182, "1Y": 365 } as const;
type Range = keyof typeof RANGES;
const isRange = (v: unknown): v is Range => typeof v === "string" && v in RANGES;

const DAY = 24 * 60 * 60 * 1000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** "Fri 10 Oct" from "2026-10-10". Read as a calendar date, not a UTC instant. */
const friendlyDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/** The dates this page works from, read once per request. */
function clock() {
  const now = Date.now();
  return {
    today: isoDay(new Date(now)),
    weekAgo: new Date(now - 7 * DAY).toISOString(),
    in60Days: isoDay(new Date(now + 60 * DAY)),
  };
}

/** A failed panel shows as empty rather than taking the whole page down. */
const soft = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback);

/**
 * Running net cash (income − expenses, every budget, all time) sampled at up
 * to 52 evenly spaced days across the range. Reversals are stored as negative
 * amounts of the same kind, so a plain sum nets them out.
 */
function cashSeries(entries: { kind: string; amountPaise: number; entryDate: string }[], days: number): CashPoint[] {
  const sorted = [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate));
  const today = new Date();
  const samples = Math.min(days, 52);
  const points: CashPoint[] = [];
  let k = 0;
  let running = 0;
  for (let s = 0; s < samples; s++) {
    const date = isoDay(new Date(today.getTime() - ((samples - 1 - s) / (samples - 1)) * days * DAY));
    while (k < sorted.length && sorted[k].entryDate <= date) {
      const e = sorted[k++];
      running += e.kind === "income" ? e.amountPaise : -e.amountPaise;
    }
    points.push({ date, paise: running });
  }
  return points;
}

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="font-jetbrains text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--text-secondary)]">{children}</p>
);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; denied?: string; error?: string }>;
}) {
  const session = await requireAdmin();
  const { base } = session;
  const sp = await searchParams;
  const range: Range = isRange(sp.range) ? sp.range : "1Y";

  const seesTreasury = hasAnyCap(session, ["finance.approve", "finance.audit"]);
  const approves = hasCap(session, "finance.approve");
  const live = dbConfigured();
  const { today, weekAgo, in60Days } = clock();

  const [subs, unread, awaiting, budgets, ledger, upcoming] = await Promise.all([
    soft(listSubmissions({}), []),
    live ? soft(unreadCount(session.email), 0) : 0,
    live && approves ? soft(countBills("submitted"), 0) : 0,
    live && seesTreasury ? soft(budgetSummary(), []) : [],
    live && seesTreasury ? soft(listLedger({}), []) : [],
    live ? soft(itemsBetween(today, in60Days), []) : [],
  ]);

  const newThisWeek = subs.filter((s) => s.receivedAt >= weekAgo).length;
  const remaining = budgets.filter((b) => !b.archived).reduce((sum, b) => sum + b.remaining, 0);
  const allocated = budgets.filter((b) => !b.archived).reduce((sum, b) => sum + b.allocated, 0);
  const next = upcoming.find((e) => (e.endDate ?? e.date) >= today);
  const firstName = session.name?.split(" ")[0];

  return (
    <AdminShell
      session={session}
      base={base}
      title={
        firstName ? (
          <>
            Welcome, <span className="text-[var(--border-active)]">{firstName}</span>
          </>
        ) : (
          "Welcome back"
        )
      }
      subtitle="Here's what's happening across the chapter"
    >
      {sp.denied && <Notice tone="error">Your role doesn&apos;t allow that.</Notice>}

      {/* Row 1: treasury + call to action | recent submissions | at a glance */}
      <section className={cn("grid gap-5", seesTreasury ? "xl:grid-cols-[1fr_1.15fr_1.2fr]" : "xl:grid-cols-[1.4fr_1fr]")}>
        {seesTreasury && (
          <div className="grid content-start gap-5">
            <div className={cardClass}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--text-secondary)]">Treasury remaining</p>
                <Link href={`${base}/finance`} className={`${pillClass} min-h-8 px-3 py-1 text-xs`}>
                  Overview <ArrowUpRight aria-hidden className="size-3" />
                </Link>
              </div>
              <p className={cn("mt-4 text-4xl font-bold tabular-nums", remaining < 0 && "text-red-400")}>{formatPaise(remaining)}</p>
              <p className="mt-1 font-jetbrains text-xs text-[var(--text-secondary)]">
                of {formatPaise(allocated)} allocated, after approved bills
              </p>
              {allocated > 0 && (
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
                  <div
                    className="h-full rounded-full bg-[var(--border-active)] shadow-[0_0_10px_var(--border-active)]"
                    style={{ width: `${Math.max(0, Math.min(100, (remaining / allocated) * 100))}%` }}
                  />
                </div>
              )}
            </div>

            {approves && awaiting > 0 && (
              <div className={`${cardClass} relative overflow-hidden text-center`}>
                <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-20 mx-auto h-32 w-64 rounded-full bg-[var(--border-active)]/20 blur-3xl" />
                <p className="relative font-semibold">
                  {awaiting} bill{awaiting === 1 ? "" : "s"} need{awaiting === 1 ? "s" : ""} your decision
                </p>
                <p className="relative mt-1 text-sm text-[var(--text-secondary)]">Approve or reject them before the money is spent.</p>
                <Link href={`${base}/finance/bills?status=submitted`} className={`${buttonClass} relative mt-4`}>
                  Review bills
                </Link>
              </div>
            )}
          </div>
        )}

        <div className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Recent submissions</h2>
            <Link href={`${base}/inbox`} className={`${pillClass} min-h-8 px-3 py-1 text-xs`}>
              Inbox <ArrowUpRight aria-hidden className="size-3" />
            </Link>
          </div>
          {subs.length === 0 ? (
            <p className="mt-6 text-sm text-[var(--text-secondary)]">Nothing has come in yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/[0.06]">
              {subs.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Link href={`${base}/s/${s.id}`} className="-mx-2 flex items-center justify-between gap-4 rounded-xl px-2 py-3 transition hover:bg-white/[0.03]">
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{shownValue(s, "name") || "Unnamed"}</span>
                      <span className="block truncate font-jetbrains text-[11px] text-[var(--text-secondary)]">
                        {s.id} · {FORMS[s.form]?.label ?? s.form}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs text-[var(--text-secondary)]">{formatTime(s.receivedAt)}</span>
                      <span
                        className={cn(
                          "block font-jetbrains text-[10px] font-bold uppercase tracking-widest",
                          (s.status ?? "new") === "new" ? "text-[var(--border-active)]" : "text-[var(--text-secondary)]"
                        )}
                      >
                        {s.status ?? "new"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={cardClass}>
          <h2 className="font-semibold">At a glance</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat value={newThisWeek} label="New submissions" note="last 7 days" tone="active" href={`${base}/inbox`} />
            <Stat value={unread} label="Announcements" note="unread" tone={unread ? "accent" : undefined} href={`${base}/announcements`} />
            {approves && <Stat value={awaiting} label="Bills" note="awaiting decision" tone={awaiting ? "accent" : undefined} href={`${base}/finance/bills`} />}
            <div className="admin-panel col-span-1 p-4">
              <p className="truncate text-base font-bold">{next ? next.title : "Nothing planned"}</p>
              <p className="mt-1 font-jetbrains text-[11px] text-[var(--border-active)]">
                {next ? `${friendlyDate(next.date)}${next.startTime ? ` · ${next.startTime}` : ""}` : "next 60 days"}
              </p>
              <Link href={`${base}/calendar`} className="mt-4 block text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                Next event
              </Link>
            </div>
          </div>
        </div>
      </section>

      {seesTreasury && (
        <section className={cardClass} aria-labelledby="cash-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="cash-title" className="font-semibold">Net cash position</h2>
              <Kicker>Income minus expenses, all budgets</Kicker>
            </div>
            <nav aria-label="Chart range" className="flex gap-1.5">
              {(Object.keys(RANGES) as Range[]).map((r) => (
                <Link
                  key={r}
                  href={`${base || "/"}?range=${r}`}
                  aria-current={r === range ? "true" : undefined}
                  className={cn(r === range ? pillActiveClass : pillClass, "min-h-8 px-3 py-1 text-xs")}
                >
                  {r}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-5">
            <CashChart points={cashSeries(ledger.map((l) => l.entry), RANGES[range])} />
          </div>
        </section>
      )}
    </AdminShell>
  );
}

function Stat({
  value,
  label,
  note,
  tone,
  href,
}: {
  value: number;
  label: string;
  note: string;
  tone?: "active" | "accent";
  href: string;
}) {
  return (
    <Link href={href} className="admin-panel block p-4 transition hover:border-white/15">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p
        className={cn(
          "font-jetbrains text-[11px]",
          tone === "active" ? "text-[var(--border-active)]" : tone === "accent" ? "text-[var(--accent-color)]" : "text-[var(--text-secondary)]"
        )}
      >
        {note}
      </p>
      <p className="mt-4 text-xs text-[var(--text-secondary)]">{label}</p>
    </Link>
  );
}
