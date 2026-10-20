const STYLE: Record<string, string> = {
  submitted: "bg-warning/15 text-warning",
  approved: "bg-[var(--border-active)]/15 text-[var(--border-active)]",
  rejected: "bg-danger/15 text-danger",
  paid: "bg-success/15 text-success",
};

export function BillStatus({ status }: { status: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs ${STYLE[status] ?? ""}`}>{status}</span>;
}
