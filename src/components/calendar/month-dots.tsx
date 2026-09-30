"use client";

import { useMemo } from "react";
import { addDays, format, isSameDay, isSameMonth, startOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";
import { AppointmentRow } from "@/components/calendar/appointment-row";
import { apptColor, dayKey, defaultSlot, groupByDay, weekStart } from "@/components/calendar/calendar-utils";

const WEEKDAYS = ["L", "M", "M", "G", "V", "S", "D"];

/** Mese per telefono: puntini colorati per giorno e, sotto, l'elenco del giorno scelto (scorre con la pagina). */
export function MonthDots({
  anchor,
  appointments,
  onSelectDay,
  onEdit,
  onNewAt,
  onGoToDay,
}: {
  anchor: Date;
  appointments: Appointment[];
  onSelectDay: (d: Date) => void;
  onEdit: (a: Appointment) => void;
  onNewAt: (d: Date) => void;
  onGoToDay: (d: Date) => void;
}) {
  const byDay = useMemo(() => groupByDay(appointments), [appointments]);
  const start = weekStart(startOfMonth(anchor));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const today = new Date();
  const dayList = byDay.get(dayKey(anchor)) ?? [];
  const slot = defaultSlot(anchor);

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border bg-card p-1.5">
        <div className="grid grid-cols-7 pb-1 text-center text-[11px] font-medium text-muted-foreground">
          {WEEKDAYS.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((d) => {
            const list = byDay.get(dayKey(d)) ?? [];
            const selected = isSameDay(d, anchor);
            const inMonth = isSameMonth(d, anchor);
            const isToday = isSameDay(d, today);
            const colors = list.slice(0, 3).map(apptColor);
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => onSelectDay(d)}
                aria-pressed={selected}
                aria-label={`${format(d, "EEEE d MMMM", { locale: it })}, ${list.length} ${list.length === 1 ? "appuntamento" : "appuntamenti"}`}
                className={cn(
                  "flex h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-sm tabular-nums transition-colors",
                  !inMonth && "text-muted-foreground/50",
                  selected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted",
                )}
              >
                <span className="leading-none">{format(d, "d")}</span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {colors.map((c, i) => (
                    <span
                      key={i}
                      className="size-1.5 rounded-full ring-1 ring-background/60"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  {list.length > 3 ? (
                    <span className={cn("text-[9px] leading-none", selected ? "text-primary-foreground" : "text-muted-foreground")}>
                      +
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-0.5">
        <button type="button" onClick={() => onGoToDay(anchor)} className="flex min-h-10 flex-col items-start justify-center text-left">
          <span className="text-sm leading-tight font-semibold capitalize">{format(anchor, "EEEE d MMMM", { locale: it })}</span>
          <span className="text-xs text-muted-foreground">
            {dayList.length} {dayList.length === 1 ? "appuntamento" : "appuntamenti"} · apri il giorno
          </span>
        </button>
        {slot ? (
          <Button size="sm" variant="outline" onClick={() => onNewAt(slot)}>
            <PlusIcon /> Nuovo
          </Button>
        ) : null}
      </div>

      {/* Nessuno scroll interno: scorre tutta la pagina. Il padding evita la barra in basso. */}
      <ul className="flex flex-col gap-2 pb-24">
        {dayList.length === 0 ? (
          <li className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Nessun appuntamento in questo giorno.
          </li>
        ) : (
          dayList.map((a) => (
            <li key={a.id}>
              <AppointmentRow appointment={a} onClick={() => onEdit(a)} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
