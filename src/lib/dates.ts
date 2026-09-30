import { format, isSameDay, addDays, startOfDay, differenceInCalendarDays, addMinutes } from "date-fns";
import { it } from "date-fns/locale";

/** Tutte le date vengono mostrate nel fuso del browser (Europe/Rome per le utenti). */

export function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toIso(date: Date): string {
  return date.toISOString();
}

function asDate(v: string | Date | null | undefined): Date | null {
  return v instanceof Date ? v : parseDate(v);
}

export function formatTime(v: string | Date | null | undefined): string {
  const d = asDate(v);
  return d ? format(d, "HH:mm", { locale: it }) : "";
}

export function formatDate(v: string | Date | null | undefined): string {
  const d = asDate(v);
  return d ? format(d, "dd/MM/yyyy", { locale: it }) : "";
}

/** "Oggi, 10:30", "Domani, 09:00", "lun 5 ott, 15:00" */
export function formatRelativeDateTime(iso: string | null | undefined): string {
  const d = parseDate(iso);
  if (!d) return "Da programmare";
  const diff = differenceInCalendarDays(d, startOfDay(new Date()));
  const time = format(d, "HH:mm", { locale: it });
  if (diff === 0) return `Oggi, ${time}`;
  if (diff === 1) return `Domani, ${time}`;
  if (diff === -1) return `Ieri, ${time}`;
  return `${format(d, "EEE d MMM", { locale: it })}, ${time}`;
}

export function formatDateTimeShort(iso: string | null | undefined): string {
  const d = parseDate(iso);
  return d ? format(d, "dd/MM/yyyy HH:mm", { locale: it }) : "—";
}

export function formatLongDate(d: Date): string {
  return format(d, "EEEE d MMMM yyyy", { locale: it });
}

export { isSameDay, addDays, startOfDay, addMinutes };

/** Valore per <input type="datetime-local"> in ora locale. */
export function toDateTimeLocalValue(v: Date | string | null | undefined): string {
  const date = asDate(v);
  return date ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
}

/** Da valore <input type="datetime-local"> (ora locale) a Date. */
export function fromDateTimeLocalValue(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function nowDateTimeLocal(): string {
  return toDateTimeLocalValue(new Date());
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
