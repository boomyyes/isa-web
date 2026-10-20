import Link from "next/link";
import { AdminShell, Notice } from "@/components/admin/AdminShell";
import { CalendarEventForm } from "@/components/admin/CalendarEventForm";
import { requireCapability } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export default async function NewCalendarEventPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireCapability("events");
  const { error } = await searchParams;
  return (
    <AdminShell session={session} base={session.base} title="Add internal event">
      <Link href={`${session.base}/calendar`} className="text-sm text-[var(--accent-color)] underline underline-offset-2">Back to calendar</Link>
      {error && <Notice tone="error">{error}</Notice>}
      <p className="text-sm text-[var(--text-secondary)]">
        Internal events are visible only to admins. To announce an event on the website, add it under
        Website → Content → Upcoming events instead.
      </p>
      <CalendarEventForm mode="create" />
    </AdminShell>
  );
}
