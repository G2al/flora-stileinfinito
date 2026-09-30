"use client";

import { useEffect, useMemo, useRef } from "react";
import { format, isSameDay, isSameMonth, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarXIcon } from "lucide-react";
import type { Appointment } from "@/types";
import { AppointmentRow } from "@/components/calendar/appointment-row";
import { dayKey, groupByDay } from "@/components/calendar/calendar-utils";

/** Elenco degli appuntamenti del mese, raggruppati per giorno. */
export function AgendaView({
  anchor,
  appointments,
  height,
  onEdit,
}: {
  anchor: Date;
  appointments: Appointment[];
  height: number;
  onEdit: (a: Appointment) => void;
}) {
  const groups = useMemo(() => [...groupByDay(appointments).entries()], [appointments]);
  const scroller = useRef<HTMLDivElement>(null);
  const todayKey = dayKey(new Date());
  const monthHasToday = isSameMonth(anchor, new Date());

  // Porta "oggi" (o il primo giorno successivo) in cima alla lista.
  useEffect(() => {
    const box = scroller.current;
    if (!box || !monthHasToday) return;
    const target = [...box.querySelectorAll<HTMLElement>("[data-day]")].find((el) => el.dataset.day! >= todayKey);
    if (target) box.scrollTop = target.offsetTop - box.offsetTop;
  }, [groups, monthHasToday, todayKey]);

  if (groups.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center"
        style={{ height }}
      >
        <CalendarXIcon className="size-8 text-muted-foreground" />
        <p className="font-medium">Nessun appuntamento</p>
        <p className="text-sm text-muted-foreground">in {format(anchor, "MMMM yyyy", { locale: it })}</p>
      </div>
    );
  }

  return (
    <div ref={scroller} className="relative overflow-x-hidden overflow-y-auto rounded-xl" style={{ height }}>
      {groups.map(([key, list]) => {
        const d = parseISO(key);
        const isToday = isSameDay(d, new Date());
        return (
          <section key={key} data-day={key} className="pb-3">
            <h3 className="sticky top-0 z-10 bg-background/95 px-1 py-1.5 text-sm font-semibold capitalize backdrop-blur">
              {isToday ? <span className="mr-1.5 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground normal-case">Oggi</span> : null}
              {format(d, "EEEE d MMMM", { locale: it })}
            </h3>
            <ul className="flex flex-col gap-2">
              {list.map((a) => (
                <li key={a.id}>
                  <AppointmentRow appointment={a} onClick={() => onEdit(a)} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
