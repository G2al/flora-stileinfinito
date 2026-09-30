import { addDays, format, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";
import { dayKey, groupByDay, weekStart } from "@/components/calendar/calendar-utils";
import { useMemo } from "react";

/** Striscia dei 7 giorni della settimana: tap per saltare al giorno; il puntino segna i giorni con appuntamenti. */
export function WeekStrip({
  anchor,
  appointments,
  onSelect,
  spanDays = 1,
}: {
  anchor: Date;
  appointments: Appointment[];
  onSelect: (d: Date) => void;
  /** Quanti giorni consecutivi (dall'ancora) sono in vista: vengono evidenziati tutti. */
  spanDays?: number;
}) {
  const busy = useMemo(() => new Set(groupByDay(appointments).keys()), [appointments]);
  const start = weekStart(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-1" role="group" aria-label="Giorni della settimana">
      {days.map((d) => {
        const offset = Math.round((d.getTime() - new Date(anchor).setHours(0, 0, 0, 0)) / 86_400_000);
        const selected = offset >= 0 && offset < spanDays;
        const isToday = isSameDay(d, today);
        return (
          <button
            key={d.toISOString()}
            type="button"
            onClick={() => onSelect(d)}
            aria-pressed={selected}
            aria-label={format(d, "EEEE d MMMM", { locale: it })}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs transition-colors",
              selected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            <span className={cn("uppercase", selected ? "opacity-90" : "text-muted-foreground")}>
              {format(d, "EEEEE", { locale: it })}
            </span>
            <span
              className={cn(
                "text-base leading-none font-semibold tabular-nums",
                isToday && !selected && "text-primary",
              )}
            >
              {format(d, "d")}
            </span>
            <span
              className={cn(
                "size-1.5 rounded-full",
                busy.has(dayKey(d)) ? (selected ? "bg-primary-foreground" : "bg-primary") : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
