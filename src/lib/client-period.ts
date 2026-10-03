import { endOfMonth, endOfYear, startOfMonth, startOfYear, subMonths } from "date-fns";
import { toDay } from "@/lib/stats";

export type ClientPreset = "month" | "last_month" | "last3" | "year" | "all" | "custom";

export const CLIENT_PRESETS: { value: ClientPreset; label: string }[] = [
  { value: "month", label: "Questo mese" },
  { value: "last_month", label: "Mese scorso" },
  { value: "last3", label: "Ultimi 3 mesi" },
  { value: "year", label: "Quest'anno" },
  { value: "all", label: "Tutto" },
  { value: "custom", label: "Personalizzato" },
];

/** Intervallo (yyyy-MM-dd, ora locale, estremi inclusi). "Tutto" copre l'intera storia, futuro compreso. */
export function clientRange(preset: Exclude<ClientPreset, "custom">, now = new Date()): { from: string; to: string } {
  switch (preset) {
    case "last_month": {
      const prev = subMonths(now, 1);
      return { from: toDay(startOfMonth(prev)), to: toDay(endOfMonth(prev)) };
    }
    case "last3":
      return { from: toDay(startOfMonth(subMonths(now, 2))), to: toDay(endOfMonth(now)) };
    case "year":
      return { from: toDay(startOfYear(now)), to: toDay(endOfYear(now)) };
    case "all":
      return { from: "2000-01-01", to: "2100-12-31" };
    case "month":
    default:
      return { from: toDay(startOfMonth(now)), to: toDay(endOfMonth(now)) };
  }
}
