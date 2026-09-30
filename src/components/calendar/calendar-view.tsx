"use client";

import { useMemo, useRef, useState } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { useAppointments } from "@/api/appointments";
import { useStaff } from "@/api/staff";
import { useFillHeight } from "@/hooks/use-fill-height";
import { useIsDesktop } from "@/hooks/use-media-query";
import { parseDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { AgendaView } from "@/components/calendar/agenda-view";
import { fetchRange, stepAnchor, titleFor, type CalView } from "@/components/calendar/calendar-utils";
import { MonthDots } from "@/components/calendar/month-dots";
import { TimeGrid } from "@/components/calendar/time-grid";
import { WeekStrip } from "@/components/calendar/week-strip";

const DESKTOP_VIEWS: { type: CalView; label: string }[] = [
  { type: "day", label: "Giorno" },
  { type: "week", label: "Settimana" },
  { type: "month", label: "Mese" },
  { type: "agenda", label: "Agenda" },
];
const MOBILE_VIEWS: { type: CalView; label: string }[] = [
  { type: "day", label: "Giorno" },
  { type: "3days", label: "3 giorni" },
  { type: "month", label: "Mese" },
  { type: "agenda", label: "Agenda" },
];

interface Props {
  onNewAt: (date: Date) => void;
  onEdit: (a: Appointment) => void;
}

export function CalendarView({ onNewAt, onEdit }: Props) {
  const isDesktop = useIsDesktop();
  const [viewPref, setViewPref] = useState<CalView>(isDesktop ? "week" : "day");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [staffFilter, setStaffFilter] = useState<number | null>(null);
  const { ref: fillRef, height } = useFillHeight();
  const touch = useRef<{ x: number; y: number; ok: boolean } | null>(null);

  // Su telefono "settimana" diventa "3 giorni" e viceversa su desktop.
  const view: CalView = isDesktop
    ? viewPref === "3days"
      ? "week"
      : viewPref
    : viewPref === "week"
      ? "3days"
      : viewPref;
  const views = isDesktop ? DESKTOP_VIEWS : MOBILE_VIEWS;

  const range = useMemo(() => fetchRange(view, anchor), [view, anchor]);
  const staffQuery = useStaff();
  const { data, isFetching } = useAppointments({ ...range, status: "confirmed" });

  const visible = useMemo(
    () => (data ?? []).filter((a) => a.scheduled_at && (staffFilter === null || a.staff_id === staffFilter)),
    [data, staffFilter],
  );

  const dayCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const a of data ?? []) {
      const d = parseDate(a.scheduled_at);
      if (d && isSameDay(d, anchor)) counts.set(a.staff_id, (counts.get(a.staff_id) ?? 0) + 1);
    }
    return counts;
  }, [data, anchor]);
  const dayTotal = useMemo(() => [...dayCounts.values()].reduce((a, b) => a + b, 0), [dayCounts]);

  const go = (dir: 1 | -1) => setAnchor((a) => stepAnchor(view, a, dir));
  const goToday = () => setAnchor(startOfDay(new Date()));
  const isTimeView = view === "day" || view === "3days" || view === "week";
  const showCounts = view === "day";

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    const onEvent = (e.target as HTMLElement).closest(".fc-event, input, [data-no-swipe]") !== null;
    touch.current = { x: t.clientX, y: t.clientY, ok: !onEvent };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const s = touch.current;
    touch.current = null;
    if (!s || !s.ok || isDesktop) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) go(dx < 0 ? 1 : -1);
  }

  return (
    <section aria-label="Calendario" className="flex flex-col gap-2.5">
      {/* Navigazione */}
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon" aria-label="Precedente" onClick={() => go(-1)}>
          <ChevronLeftIcon />
        </Button>
        <div className="relative min-w-0 flex-1 text-center">
          <h2 className="truncate text-base font-semibold capitalize md:text-lg">{titleFor(view, anchor)}</h2>
          {isFetching ? (
            <Loader2Icon
              className="absolute top-1/2 right-0 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-label="Aggiornamento"
            />
          ) : null}
          <input
            type="date"
            aria-label="Vai a una data"
            value={format(anchor, "yyyy-MM-dd")}
            onChange={(e) => {
              if (!e.target.value) return;
              const d = new Date(`${e.target.value}T00:00:00`);
              if (!Number.isNaN(d.getTime())) setAnchor(d);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <Button variant="outline" size="icon" aria-label="Successivo" onClick={() => go(1)}>
          <ChevronRightIcon />
        </Button>
        <Button variant="outline" onClick={goToday}>
          Oggi
        </Button>
      </div>

      {/* Vista */}
      <div
        role="group"
        aria-label="Vista calendario"
        className="grid grid-cols-4 gap-0.5 rounded-lg border bg-muted/40 p-0.5 md:ml-auto md:w-96"
      >
        {views.map((v) => (
          <button
            key={v.type}
            type="button"
            aria-pressed={view === v.type}
            onClick={() => setViewPref(v.type)}
            className={cn(
              "min-h-10 rounded-md px-1 text-sm font-medium transition-colors md:min-h-8",
              view === v.type ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Striscia dei giorni (solo telefono) */}
      {!isDesktop && (view === "day" || view === "3days") ? (
        <WeekStrip
          anchor={anchor}
          appointments={visible}
          onSelect={setAnchor}
          spanDays={view === "3days" ? 3 : 1}
        />
      ) : null}

      {/* Filtro operatrici */}
      {staffQuery.data && staffQuery.data.length > 0 ? (
        <div
          role="group"
          aria-label="Filtra per operatrice"
          data-no-swipe
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:px-0"
        >
          {[{ id: null as number | null, name: "Tutte" }, ...staffQuery.data].map((s) => {
            const active = staffFilter === s.id;
            const count = showCounts ? (s.id === null ? dayTotal : (dayCounts.get(s.id) ?? 0)) : null;
            return (
              <button
                key={s.id ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setStaffFilter(s.id)}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {s.name}
                {count !== null ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      active ? "bg-primary-foreground/20" : "bg-primary/10 text-primary",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Contenuto */}
      <div ref={fillRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ touchAction: "pan-y" }}>
        {isTimeView || (view === "month" && isDesktop) ? (
          <TimeGrid
            view={view === "month" ? "month" : (view as "day" | "3days" | "week")}
            anchor={anchor}
            appointments={visible}
            height={height}
            showStaff={view === "day" && staffFilter === null}
            onNewAt={onNewAt}
            onEdit={onEdit}
          />
        ) : view === "month" ? (
          <MonthDots
            anchor={anchor}
            appointments={visible}
            height={height}
            onSelectDay={setAnchor}
            onEdit={onEdit}
            onNewAt={onNewAt}
            onGoToDay={(d) => {
              setAnchor(d);
              setViewPref("day");
            }}
          />
        ) : (
          <AgendaView anchor={anchor} appointments={visible} height={height} onEdit={onEdit} />
        )}
      </div>
    </section>
  );
}
