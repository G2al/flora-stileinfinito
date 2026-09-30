import { cn } from "@/lib/utils";
import { WEEKDAY_LONG, WEEKDAY_SHORT, fillHours, fmtInt } from "@/lib/stats";
import type { StatsHour, StatsWeekday } from "@/types/stats";
import { WidgetEmpty } from "@/components/stats/widget";

interface Item {
  key: string | number;
  label: string;
  fullLabel: string;
  value: number;
}

/** Colonne verticali con il valore sopra; la più alta è evidenziata. */
function ColumnChart({ items, unit }: { items: Item[]; unit: string }) {
  const max = Math.max(0, ...items.map((i) => i.value));
  const top = items.find((i) => i.value === max && max > 0);
  const HEIGHT = 120;

  return (
    <ul className="flex items-end gap-1" style={{ height: HEIGHT + 34 }} aria-label={unit}>
      {items.map((i) => {
        const h = max > 0 ? Math.round((i.value / max) * HEIGHT) : 0;
        const isTop = top?.key === i.key;
        return (
          <li
            key={i.key}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
            aria-label={`${i.fullLabel}: ${i.value} ${unit}${isTop ? " (massimo)" : ""}`}
            title={`${i.fullLabel}: ${i.value} ${unit}`}
          >
            <span className={cn("text-[10px] tabular-nums", isTop ? "font-bold text-primary" : "text-muted-foreground")}>
              {i.value > 0 ? fmtInt(i.value) : ""}
            </span>
            <span
              className={cn("w-full max-w-9 rounded-t-md", isTop ? "bg-primary" : "bg-primary/35")}
              style={{ height: Math.max(h, i.value > 0 ? 3 : 1) }}
              aria-hidden
            />
            <span className={cn("text-[11px]", isTop ? "font-semibold text-foreground" : "text-muted-foreground")}>{i.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function WeekdayChart({ data }: { data: StatsWeekday[] }) {
  const byDay = new Map(data.map((d) => [d.weekday, d.appointments]));
  const items: Item[] = WEEKDAY_SHORT.map((label, idx) => ({
    key: idx + 1,
    label,
    fullLabel: WEEKDAY_LONG[idx],
    value: byDay.get(idx + 1) ?? 0,
  }));
  return <ColumnChart items={items} unit="appuntamenti" />;
}

export function HourChart({ data }: { data: StatsHour[] }) {
  const hours = fillHours(data);
  if (hours.length === 0) return <WidgetEmpty />;
  return (
    <ColumnChart
      unit="appuntamenti"
      items={hours.map((h) => ({
        key: h.hour,
        label: String(h.hour),
        fullLabel: `Ore ${h.hour}:00`,
        value: h.appointments,
      }))}
    />
  );
}
