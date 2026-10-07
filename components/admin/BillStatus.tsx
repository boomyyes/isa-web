const STYLE: Record<string, string> = {
  submitted: "bg-amber-500/15 text-amber-400",
  approved: "bg-[var(--border-active)]/15 text-[var(--border-active)]",
  rejected: "bg-red-500/15 text-red-400",
  paid: "bg-emerald-500/15 text-emerald-400",
};

export function BillStatus({ status }: { status: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs ${STYLE[status] ?? ""}`}>{status}</span>;
}
