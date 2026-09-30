"use client";

import { CalendarCheckIcon, CalendarClockIcon, CalendarDaysIcon, CalendarRangeIcon, CheckCheckIcon } from "lucide-react";
import { useDashboard } from "@/api/appointments";
import { cn } from "@/lib/utils";

const TILES = [
  { key: "today", label: "Oggi", icon: CalendarDaysIcon, tone: "" },
  { key: "tomorrow", label: "Domani", icon: CalendarCheckIcon, tone: "" },
  { key: "week", label: "Settimana", icon: CalendarRangeIcon, tone: "" },
  { key: "to_schedule", label: "Da programmare", icon: CalendarClockIcon, tone: "warning" },
  { key: "confirmed", label: "Confermate", icon: CheckCheckIcon, tone: "success" },
] as const;

const ICON_TONES = {
  "": "text-primary",
  warning: "text-amber-600 dark:text-amber-400",
  success: "text-green-600 dark:text-green-400",
};

/** Riepilogo compatto in una sola riga (scorrevole su telefono): lascia tutto lo spazio al calendario. */
export function StatsCards({ onOpenToSchedule }: { onOpenToSchedule?: () => void }) {
  const { data, isLoading, isError } = useDashboard();

  return (
    <div
      className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
      aria-label="Riepilogo"
      role="list"
    >
      {TILES.map((t) => {
        const value = isLoading ? "…" : isError || !data ? "–" : data[t.key];
        const className = cn(
          "flex h-9 shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 text-sm",
          t.tone === "warning" && "border-amber-500/40 bg-amber-500/10",
          t.tone === "success" && "border-green-500/30",
        );
        const content = (
          <>
            <t.icon className={cn("hidden size-4 md:block", ICON_TONES[t.tone])} aria-hidden />
            <span className="text-muted-foreground">{t.label}</span>
            <strong className="tabular-nums">{value}</strong>
          </>
        );
        return t.key === "to_schedule" && onOpenToSchedule ? (
          <button
            key={t.key}
            type="button"
            role="listitem"
            onClick={onOpenToSchedule}
            className={cn(className, "transition-colors hover:bg-amber-500/20")}
          >
            {content}
          </button>
        ) : (
          <div key={t.key} role="listitem" className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
