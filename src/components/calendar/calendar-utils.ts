import { addDays, addMonths, format, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { BUSINESS_HOURS, DEFAULT_SERVICE_COLOR } from "@/config/business";
import { parseDate } from "@/lib/dates";
import type { Appointment } from "@/types";

export type CalView = "day" | "3days" | "week" | "month" | "agenda";

export const weekStart = (d: Date) => startOfWeek(d, { weekStartsOn: 1 });

/** Intervallo da caricare dal backend per la vista corrente (from incluso, to escluso). */
export function fetchRange(view: CalView, anchor: Date): { from: string; to: string } {
  let start: Date;
  let end: Date;
  if (view === "month") {
    start = weekStart(startOfMonth(anchor));
    end = addDays(start, 42);
  } else if (view === "agenda") {
    start = startOfMonth(anchor);
    end = startOfMonth(addMonths(anchor, 1));
  } else {
    // giorno / 3 giorni / settimana: carichiamo la settimana (+ margine) così
    // la striscia dei giorni conosce già i giorni occupati.
    start = weekStart(anchor);
    end = addDays(start, 10);
  }
  return { from: start.toISOString(), to: end.toISOString() };
}

export function stepAnchor(view: CalView, anchor: Date, dir: 1 | -1): Date {
  switch (view) {
    case "day":
      return addDays(anchor, dir);
    case "3days":
      return addDays(anchor, 3 * dir);
    case "week":
      return addDays(anchor, 7 * dir);
    default:
      return addMonths(anchor, dir);
  }
}

export function titleFor(view: CalView, anchor: Date): string {
  switch (view) {
    case "day":
      return format(anchor, "EEE d MMMM", { locale: it });
    case "3days":
    case "week": {
      const days = view === "week" ? 6 : 2;
      const start = view === "week" ? weekStart(anchor) : anchor;
      const end = addDays(start, days);
      const sameMonth = start.getMonth() === end.getMonth();
      return sameMonth
        ? `${format(start, "d", { locale: it })} – ${format(end, "d MMM yyyy", { locale: it })}`
        : `${format(start, "d MMM", { locale: it })} – ${format(end, "d MMM yyyy", { locale: it })}`;
    }
    default:
      return format(anchor, "MMMM yyyy", { locale: it });
  }
}

export function apptColor(a: Appointment): string {
  return a.services?.[0]?.color || DEFAULT_SERVICE_COLOR;
}

export function dayKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function groupByDay(list: Appointment[]): Map<string, Appointment[]> {
  const map = new Map<string, Appointment[]>();
  const sorted = [...list].sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
  for (const a of sorted) {
    const d = parseDate(a.scheduled_at);
    if (!d) continue;
    const k = dayKey(d);
    const arr = map.get(k);
    if (arr) arr.push(a);
    else map.set(k, [a]);
  }
  return map;
}

/** Orario proposto per un nuovo appuntamento nel giorno indicato (null se il giorno è passato). */
export function defaultSlot(day: Date): Date | null {
  const today = startOfDay(new Date());
  const d = startOfDay(day);
  if (d.getTime() < today.getTime()) return null;
  const [h, m] = BUSINESS_HOURS.open.split(":").map(Number);
  const slot = new Date(d);
  slot.setHours(h, m, 0, 0);
  if (d.getTime() === today.getTime()) {
    const now = new Date();
    const rounded = new Date(now);
    rounded.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    return rounded.getTime() > slot.getTime() ? rounded : slot;
  }
  return slot;
}

/** Testo bianco o scuro in base alla luminosità dello sfondo. */
export function textOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? "#111111" : "#ffffff";
}
