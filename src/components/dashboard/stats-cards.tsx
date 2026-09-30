"use client";

import { CalendarCheckIcon, CalendarClockIcon, CalendarDaysIcon, CalendarRangeIcon, CheckCheckIcon } from "lucide-react";
import { useDashboard } from "@/api/appointments";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/shared/page-parts";

const TILES = [
  { key: "today", label: "Oggi", icon: CalendarDaysIcon, tone: "" },
  { key: "tomorrow", label: "Domani", icon: CalendarCheckIcon, tone: "" },
  { key: "week", label: "Settimana", icon: CalendarRangeIcon, tone: "" },
  { key: "to_schedule", label: "Da programmare", icon: CalendarClockIcon, tone: "warning" },
  { key: "confirmed", label: "Confermate", icon: CheckCheckIcon, tone: "success" },
] as const;

const TONES = {
  "": "bg-primary/10 text-primary",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  success: "bg-green-500/15 text-green-600 dark:text-green-400",
};

export function StatsCards({ onOpenToSchedule }: { onOpenToSchedule?: () => void }) {
  const { data, isLoading, isError } = useDashboard();

  return (
    <>
      {/* Telefono: riga compatta scorrevole */}
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:hidden"
        aria-label="Riepilogo"
        role="list"
      >
        {TILES.map((t) => {
          const value = isLoading ? "…" : isError || !data ? "–" : data[t.key];
          const className = cn(
            "flex h-9 shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 text-sm",
            t.tone === "warning" && "border-amber-500/40 bg-amber-500/10",
          );
          const content = (
            <>
              <span className="text-muted-foreground">{t.label}</span>
              <strong className="tabular-nums">{value}</strong>
            </>
          );
          return t.key === "to_schedule" && onOpenToSchedule ? (
            <button key={t.key} type="button" role="listitem" onClick={onOpenToSchedule} className={className}>
              {content}
            </button>
          ) : (
            <div key={t.key} role="listitem" className={className}>
              {content}
            </div>
          );
        })}
      </div>

      {/* Tablet/desktop: riquadri */}
      <div className="hidden grid-cols-3 gap-3 md:grid lg:grid-cols-5">
      {TILES.map((t, i) => (
        <div
          key={t.key}
          className={cn(
            "flex items-center gap-3 rounded-xl border bg-card p-3",
            i === 4 && "md:col-span-1",
          )}
        >
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", TONES[t.tone])}>
            <t.icon className="size-5" />
          </span>
          <div className="min-w-0">
            {isLoading ? (
              <Skeleton className="mb-1 h-6 w-8" />
            ) : (
              <p className="text-2xl leading-none font-semibold tabular-nums">{isError || !data ? "–" : data[t.key]}</p>
            )}
            <p className="truncate text-xs text-muted-foreground">{t.label}</p>
          </div>
        </div>
      ))}
      </div>
    </>
  );
}
