import { fmtInt, fmtPercent } from "@/lib/stats";
import type { AppointmentStatus } from "@/types";
import type { StatsTotals } from "@/types/stats";
import { STATUS_LABELS } from "@/components/shared/status-badge";
import { WidgetEmpty } from "@/components/stats/widget";

// Stessi colori dei badge di stato usati nel resto dell'app.
const COLORS: Record<AppointmentStatus, { stroke: string; dot: string }> = {
  pending: { stroke: "stroke-amber-500", dot: "bg-amber-500" },
  confirmed: { stroke: "stroke-green-500", dot: "bg-green-500" },
  completed: { stroke: "stroke-blue-500", dot: "bg-blue-500" },
  cancelled: { stroke: "stroke-red-500", dot: "bg-red-500" },
};

const ORDER: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled"];

export function StatusDonut({ byStatus }: { byStatus: StatsTotals["by_status"] }) {
  const total = ORDER.reduce((sum, s) => sum + byStatus[s], 0);
  if (total === 0) return <WidgetEmpty />;

  const R = 48;
  const C = 2 * Math.PI * R;
  const segments = ORDER.reduce<{ status: AppointmentStatus; len: number; offset: number }[]>((acc, status) => {
    const value = byStatus[status];
    if (value === 0) return acc;
    const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].len : 0;
    return [...acc, { status, len: (value / total) * C, offset }];
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label={`${total} appuntamenti per stato`}>
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="14" className="stroke-muted" />
          {segments.map((seg) => (
            <circle
              key={seg.status}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="14"
              className={COLORS[seg.status].stroke}
              strokeDasharray={`${Math.max(seg.len - 1.5, 0.5)} ${C}`}
              strokeDashoffset={-seg.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{fmtInt(total)}</span>
          <span className="text-[11px] text-muted-foreground">totali</span>
        </div>
      </div>

      <ul className="grid w-full max-w-md flex-1 gap-2">
        {ORDER.map((s) => (
          <li key={s} className="flex items-center gap-2.5 text-sm">
            <span className={`size-3 shrink-0 rounded-full ${COLORS[s].dot}`} aria-hidden />
            <span className="flex-1">{STATUS_LABELS[s]}</span>
            <span className="font-semibold tabular-nums">{fmtInt(byStatus[s])}</span>
            <span className="w-14 text-right text-xs text-muted-foreground tabular-nums">
              {fmtPercent((byStatus[s] / total) * 100)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
