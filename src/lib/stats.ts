import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { it } from "date-fns/locale";
import type { Stats, StatsDay } from "@/types/stats";

export const MAX_RANGE_DAYS = 366;

export type Preset = "today" | "week" | "month" | "last_month" | "last30" | "year" | "custom";

export const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "Oggi" },
  { value: "week", label: "Questa settimana" },
  { value: "month", label: "Questo mese" },
  { value: "last_month", label: "Mese scorso" },
  { value: "last30", label: "Ultimi 30 giorni" },
  { value: "year", label: "Quest'anno" },
  { value: "custom", label: "Personalizzato" },
];

export const DEFAULT_PRESET: Preset = "month";

/** yyyy-MM-dd in ora locale. */
export const toDay = (d: Date) => format(d, "yyyy-MM-dd");
/** Parse locale di una stringa yyyy-MM-dd (mai via UTC: niente sfasamenti di un giorno). */
export const fromDay = (s: string) => parseISO(s);

export function isPreset(v: string | null): v is Preset {
  return !!v && PRESETS.some((p) => p.value === v);
}

/** Intervallo (estremi inclusi) di un preset, calcolato in ora locale. */
export function presetRange(preset: Exclude<Preset, "custom">, now = new Date()): { from: string; to: string } {
  switch (preset) {
    case "today":
      return { from: toDay(now), to: toDay(now) };
    case "week": {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      return { from: toDay(start), to: toDay(addDays(start, 6)) };
    }
    case "last_month": {
      const prev = subMonths(now, 1);
      return { from: toDay(startOfMonth(prev)), to: toDay(endOfMonth(prev)) };
    }
    case "last30":
      return { from: toDay(subDays(now, 29)), to: toDay(now) };
    case "year":
      return { from: toDay(startOfYear(now)), to: toDay(now) };
    case "month":
    default:
      return { from: toDay(startOfMonth(now)), to: toDay(endOfMonth(now)) };
  }
}

export function rangeDays(from: string, to: string): number {
  return differenceInCalendarDays(fromDay(to), fromDay(from)) + 1;
}

/** Messaggio di errore per un intervallo non valido, altrimenti null. */
export function validateRange(from: string | null, to: string | null): string | null {
  if (!from || !to) return "Scegli la data di inizio e di fine.";
  if (Number.isNaN(fromDay(from).getTime()) || Number.isNaN(fromDay(to).getTime())) return "Date non valide.";
  const days = rangeDays(from, to);
  if (days < 1) return "La data di fine non può precedere quella di inizio.";
  if (days > MAX_RANGE_DAYS) return `L'intervallo può durare al massimo ${MAX_RANGE_DAYS} giorni (ora sono ${days}).`;
  return null;
}

/** "12 ottobre 2026", "1 - 31 ottobre 2026", "5 settembre - 3 ottobre 2026" */
export function periodLabel(from: string, to: string): string {
  const a = fromDay(from);
  const b = fromDay(to);
  if (from === to) return format(a, "d MMMM yyyy", { locale: it });
  if (a.getFullYear() === b.getFullYear()) {
    if (a.getMonth() === b.getMonth()) return `${format(a, "d", { locale: it })} - ${format(b, "d MMMM yyyy", { locale: it })}`;
    return `${format(a, "d MMMM", { locale: it })} - ${format(b, "d MMMM yyyy", { locale: it })}`;
  }
  return `${format(a, "d MMM yyyy", { locale: it })} - ${format(b, "d MMM yyyy", { locale: it })}`;
}

// ---- Formattazione numeri ----

const nf0 = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });

export const fmtInt = (n: number) => nf0.format(n);
/** Massimo 1 decimale, virgola italiana. */
export const fmtNum = (n: number) => nf1.format(n);
export const fmtHours = (h: number) => `${nf1.format(h)} h`;
export const fmtPercent = (p: number) => `${nf1.format(p)}%`;

/** Minuti -> "1h 30", "2h", "45 min". */
export function fmtDuration(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${String(r).padStart(2, "0")}` : `${h}h`;
}

export function fmtSigned(p: number): string {
  return `${p > 0 ? "+" : p < 0 ? "−" : ""}${nf1.format(Math.abs(p))}%`;
}

// ---- Giorni della settimana ----

export const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
export const WEEKDAY_LONG = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];

// ---- Serie per i grafici ----

export interface TrendPoint {
  key: string;
  /** Etichetta breve sull'asse X */
  label: string;
  /** Testo completo nel tooltip */
  title: string;
  appointments: number;
  cancelled: number;
}

const GROUP_BY_WEEK_ABOVE = 45;

/** Un punto per giorno; oltre 45 giorni si raggruppa per settimana (lunedì-domenica). */
export function buildTrend(days: StatsDay[]): { points: TrendPoint[]; grouped: boolean } {
  if (days.length <= GROUP_BY_WEEK_ABOVE) {
    return {
      grouped: false,
      points: days.map((d) => {
        const date = fromDay(d.date);
        return {
          key: d.date,
          label: format(date, "d", { locale: it }),
          title: format(date, "EEE d MMMM", { locale: it }),
          appointments: d.appointments,
          cancelled: d.cancelled,
        };
      }),
    };
  }
  const weeks = new Map<string, TrendPoint & { start: Date }>();
  for (const d of days) {
    const date = fromDay(d.date);
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const key = toDay(start);
    const w = weeks.get(key);
    if (w) {
      w.appointments += d.appointments;
      w.cancelled += d.cancelled;
    } else {
      weeks.set(key, {
        key,
        start,
        label: format(start, "d MMM", { locale: it }),
        title: `Settimana dal ${format(start, "d MMMM", { locale: it })}`,
        appointments: d.appointments,
        cancelled: d.cancelled,
      });
    }
  }
  return { grouped: true, points: [...weeks.values()] };
}

/** Ore continue dalla prima all'ultima con appuntamenti (le mancanti a 0). */
export function fillHours(byHour: Stats["by_hour"]): { hour: number; appointments: number }[] {
  if (byHour.length === 0) return [];
  const map = new Map(byHour.map((h) => [h.hour, h.appointments]));
  const min = Math.min(...byHour.map((h) => h.hour));
  const max = Math.max(...byHour.map((h) => h.hour));
  return Array.from({ length: max - min + 1 }, (_, i) => ({ hour: min + i, appointments: map.get(min + i) ?? 0 }));
}

/** Estremo "rotondo" per l'asse Y (1, 2, 5, 10, 20, 50...). Sempre >= 4 per non avere scale minuscole. */
export function niceMax(value: number): number {
  const v = Math.max(value, 4);
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

// ---- Insight testuali ----

function topBy<T>(list: T[], value: (t: T) => number): T | null {
  let best: T | null = null;
  let bestValue = 0;
  for (const item of list) {
    const v = value(item);
    if (v > bestValue) {
      best = item;
      bestValue = v;
    }
  }
  return best;
}

/** Frasi calcolate dai dati; vuoto se non c'è nulla da dire. */
export function buildInsights(stats: Stats): string[] {
  if (stats.totals.appointments === 0) return [];
  const out: string[] = [];

  const day = topBy(stats.by_weekday, (d) => d.appointments);
  if (day) out.push(`Il giorno più impegnato è ${WEEKDAY_LONG[day.weekday - 1]} (${fmtInt(day.appointments)} appuntamenti).`);

  const hour = topBy(stats.by_hour, (h) => h.appointments);
  if (hour) out.push(`L'ora di punta è le ${hour.hour}:00 (${fmtInt(hour.appointments)} appuntamenti).`);

  const service = topBy(stats.by_service, (s) => s.count);
  if (service) out.push(`Il servizio più richiesto è ${service.name} (${fmtInt(service.count)} volte).`);

  const staff = topBy(stats.by_staff, (s) => s.appointments);
  if (staff) out.push(`L'operatrice più occupata è ${staff.name} (${fmtInt(staff.appointments)} appuntamenti, ${fmtHours(staff.hours)}).`);

  const { cancellation_rate: rate, by_status } = stats.totals;
  if (by_status.cancelled > 0 && rate > 15) out.push(`Gli annullamenti sono alti: ${fmtPercent(rate)} degli appuntamenti.`);

  const { returning, served } = stats.clients;
  if (served > 0 && returning > 0) out.push(`${fmtInt(returning)} clienti su ${fmtInt(served)} erano già venuti in passato.`);

  return out;
}
