import { buttonClass, cardClass } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";

type Values = {
  id?: string;
  title?: string;
  date?: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  notes?: string | null;
};

/** One form for adding and editing internal events. Plain POST, works without JavaScript. */
export function CalendarEventForm({ values = {}, mode }: { values?: Values; mode: "create" | "update" }) {
  const v = (x?: string | null) => x ?? "";
  return (
    <form method="post" action="/api/admin/calendar" className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
      <input type="hidden" name="action" value={mode} />
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="sm:col-span-2">
        <label htmlFor="title" className={labelClass}>Title *</label>
        <input id="title" name="title" required maxLength={150} defaultValue={v(values.title)} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="date" className={labelClass}>Date *</label>
        <input id="date" name="date" type="date" required defaultValue={v(values.date)} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="endDate" className={labelClass}>Ends on (multi-day)</label>
        <input id="endDate" name="endDate" type="date" defaultValue={v(values.endDate)} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="startTime" className={labelClass}>Start time</label>
        <input id="startTime" name="startTime" type="time" defaultValue={v(values.startTime)} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="endTime" className={labelClass}>End time</label>
        <input id="endTime" name="endTime" type="time" defaultValue={v(values.endTime)} className={fieldClass} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="location" className={labelClass}>Location</label>
        <input id="location" name="location" maxLength={150} defaultValue={v(values.location)} className={fieldClass} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="notes" className={labelClass}>Notes</label>
        <textarea id="notes" name="notes" rows={4} maxLength={2000} defaultValue={v(values.notes)} className={`${fieldClass} resize-y`} />
      </div>
      <div className="sm:col-span-2">
        <button className={buttonClass}>{mode === "create" ? "Add to calendar" : "Save changes"}</button>
      </div>
    </form>
  );
}
