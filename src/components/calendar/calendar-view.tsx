"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { useAppointments } from "@/api/appointments";
import { useServiceCategories } from "@/api/service-categories";
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
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
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
  const categoriesQuery = useServiceCategories();
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  // Ogni categoria (anche sottocategoria) -> categoria principale: il filtro include le sottocategorie.
  const topOf = useMemo(() => {
    const map = new Map<number, number>();
    for (const c of categories) {
      map.set(c.id, c.id);
      for (const sub of c.children) map.set(sub.id, c.id);
    }
    return map;
  }, [categories]);
  const topCategoriesOf = (a: { services?: { category_id: number | null }[] }) => {
    const ids = new Set<number>();
    for (const sv of a.services ?? []) {
      const top = sv.category_id === null ? undefined : topOf.get(sv.category_id);
      if (top !== undefined) ids.add(top);
    }
    return ids;
  };
  const { data, isFetching } = useAppointments({ ...range, status: "confirmed" });

  const visible = useMemo(
    () =>
      (data ?? []).filter(
        (a) => a.scheduled_at && (categoryFilter === null || topCategoriesOf(a).has(categoryFilter)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, categoryFilter, topOf],
  );

  // Appuntamenti del giorno per categoria principale (uno può contare in più categorie).
  const { dayCounts, dayTotal } = useMemo(() => {
    const counts = new Map<number, number>();
    let total = 0;
    for (const a of data ?? []) {
      const d = parseDate(a.scheduled_at);
      if (!d || !isSameDay(d, anchor)) continue;
      total += 1;
      for (const id of topCategoriesOf(a)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return { dayCounts: counts, dayTotal: total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, anchor, topOf]);

  const go = (dir: 1 | -1) => setAnchor((a) => stepAnchor(view, a, dir));
  const goToday = () => setAnchor(startOfDay(new Date()));

  // La barra in basso, toccando "Calendario" quando è già aperto, salta a oggi.
  useEffect(() => {
    const onToday = () => setAnchor(startOfDay(new Date()));
    window.addEventListener("calendar:today", onToday);
    return () => window.removeEventListener("calendar:today", onToday);
  }, []);
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
      {/* Barra strumenti: su desktop tutto su una riga per lasciare spazio al calendario */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-3">
      {/* Navigazione */}
      <div className="flex items-center gap-1.5 md:shrink-0">
        <Button variant="outline" size="icon" aria-label="Precedente" onClick={() => go(-1)}>
          <ChevronLeftIcon />
        </Button>
        <div className="relative min-w-0 flex-1 text-center md:min-w-44 md:flex-none">
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
        className="grid grid-cols-4 gap-0.5 rounded-lg border bg-muted/40 p-0.5 md:order-3 md:w-80 md:shrink-0"
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

      {/* Filtro per categoria di servizio */}
      {categories.length > 0 ? (
        <div
          role="group"
          aria-label="Filtra per categoria"
          data-no-swipe
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:order-2 md:mx-0 md:min-w-0 md:flex-1 md:px-0 md:pb-0"
        >
          {[{ id: null as number | null, name: "Tutte" }, ...categories].map((s) => {
            const active = categoryFilter === s.id;
            const count = showCounts ? (s.id === null ? dayTotal : (dayCounts.get(s.id) ?? 0)) : null;
            return (
              <button
                key={s.id ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setCategoryFilter(s.id)}
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

      </div>

      {/* Contenuto */}
      <div ref={fillRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ touchAction: "pan-y" }}>
        {isTimeView || (view === "month" && isDesktop) ? (
          <TimeGrid
            view={view === "month" ? "month" : (view as "day" | "3days" | "week")}
            anchor={anchor}
            appointments={visible}
            height={height}
            showStaff={view === "day"}
            onNewAt={onNewAt}
            onEdit={onEdit}
          />
        ) : view === "month" ? (
          <MonthDots
            anchor={anchor}
            appointments={visible}
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
