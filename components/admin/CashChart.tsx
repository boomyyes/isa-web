// Net cash position over time, for the admin dashboard. One series (running
// income minus expenses), so there's no legend: the panel title names it.
//
// Server-rendered SVG, no chart library and no client JS. Hover uses native
// SVG <title> tooltips on full-height hit columns wider than the line, and a
// visually hidden table carries the same numbers for screen readers.
//
// Colour: --border-active (cyan) for the line and a fading area under it; the
// grid and labels stay in text tokens. Checked with the dataviz validator on
// the #141414 panel (contrast and separation pass; it is one series, so the
// categorical lightness band doesn't apply).

import { formatPaise } from "@/lib/admin/finance";

export type CashPoint = { date: string; paise: number };

const W = 1000;
const H = 240;
const PAD_TOP = 12;
const PAD_BOTTOM = 8;

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const monthLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { month: "short" });

/** A round-ish step so the three gridlines land on readable rupee values. */
function niceMax(value: number) {
  if (value <= 0) return 100_00;
  const rupees = value / 100;
  const magnitude = 10 ** Math.floor(Math.log10(rupees));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= rupees) ?? 10;
  return step * magnitude * 100;
}

export function CashChart({ points }: { points: CashPoint[] }) {
  if (points.length < 2) {
    return <p className="py-16 text-center text-sm text-[var(--text-secondary)]">No ledger entries in this period yet.</p>;
  }

  const values = points.map((p) => p.paise);
  const min = Math.min(0, ...values);
  const max = niceMax(Math.max(...values));
  const span = max - min || 1;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (paise: number) => PAD_TOP + (1 - (paise - min) / span) * (H - PAD_TOP - PAD_BOTTOM);

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.paise).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const ticks = [max, (max + min) / 2, min];
  const colW = W / points.length;
  const last = points[points.length - 1];

  // Month labels: the first point of each month, at most six.
  const months = points
    .map((p, i) => ({ i, label: monthLabel(p.date), month: p.date.slice(0, 7) }))
    .filter((m, k, all) => k === 0 || m.month !== all[k - 1].month);
  const every = Math.ceil(months.length / 6);

  return (
    <figure>
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className="flex h-56 flex-col justify-between py-1 text-right font-jetbrains text-[10px] tabular-nums text-[var(--text-secondary)]">
          {ticks.map((t) => (
            <span key={t}>{formatPaise(t)}</span>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-56 w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="cash-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--border-active)" stopOpacity="0.3" />
              <stop offset="1" stopColor="var(--border-active)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.06)" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill="url(#cash-fill)" />
          <path d={line} fill="none" stroke="var(--border-active)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {/* Hover: one full-height column per point, wider than the line. */}
          {points.map((p, i) => (
            <rect key={p.date} x={x(i) - colW / 2} y="0" width={colW} height={H} fill="transparent" className="hover:fill-white/[0.04]">
              <title>{`${shortDate(p.date)}: ${formatPaise(p.paise)}`}</title>
            </rect>
          ))}
        </svg>
      </div>
      <div className="relative ml-[4.5rem] mt-2 h-4 font-jetbrains text-[10px] text-[var(--text-secondary)]">
        {months
          .filter((_, k) => k % every === 0)
          .map((m) => (
            <span key={m.month} className="absolute -translate-x-1/2" style={{ left: `${(m.i / (points.length - 1)) * 100}%` }}>
              {m.label}
            </span>
          ))}
      </div>
      <figcaption className="mt-3 text-xs text-[var(--text-secondary)]">
        Today: <span className="tabular-nums text-[var(--text-primary)]">{formatPaise(last.paise)}</span>. Hover the chart
        for any day. Includes every budget; reversals are netted out.
      </figcaption>
      <table className="sr-only">
        <caption>Net cash position by date</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Net cash</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{shortDate(p.date)}</td>
              <td>{formatPaise(p.paise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
