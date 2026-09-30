import { fmtHours, fmtInt, fmtDuration } from "@/lib/stats";
import type { StatsService, StatsStaff } from "@/types/stats";
import { WidgetEmpty } from "@/components/stats/widget";

const NEUTRAL = "var(--muted-foreground)";

interface Row {
  key: string | number;
  label: string;
  value: number;
  color: string;
  detail: string;
  srText: string;
}

/** Barre orizzontali: etichetta e dettaglio sopra, barra sotto (leggibile anche a 360px). */
function BarList({ rows }: { rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{r.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{r.detail}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={r.srText}>
            <div
              className="h-full rounded-full"
              style={{ width: r.value > 0 ? `${Math.max(2, (r.value / max) * 100)}%` : 0, backgroundColor: r.color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StaffBars({ staff }: { staff: StatsStaff[] }) {
  if (staff.length === 0) return <WidgetEmpty>Nessuna operatrice.</WidgetEmpty>;
  return (
    <BarList
      rows={staff.map((s) => ({
        key: s.staff_id,
        label: s.name,
        value: s.appointments,
        color: "var(--primary)",
        detail: `${fmtInt(s.appointments)} app. · ${fmtHours(s.hours)}`,
        srText: `${s.name}: ${s.appointments} appuntamenti, ${fmtHours(s.hours)}`,
      }))}
    />
  );
}

export function ServiceBars({ services }: { services: StatsService[] }) {
  if (services.length === 0) return <WidgetEmpty>Nessun servizio nel periodo.</WidgetEmpty>;
  return (
    <BarList
      rows={services.map((s) => ({
        key: s.service_id,
        label: s.name,
        value: s.count,
        color: s.color || NEUTRAL,
        detail: `${fmtInt(s.count)} × · ${fmtDuration(s.minutes)}`,
        srText: `${s.name}: ${s.count} volte, ${fmtDuration(s.minutes)} in totale`,
      }))}
    />
  );
}
