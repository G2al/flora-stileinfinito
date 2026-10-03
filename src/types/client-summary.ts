import type { Appointment, Client } from "@/types";

export interface SummaryTotals {
  appointments: number;
  realized: number;
  spent: number;
  avg_ticket: number;
  upcoming: number;
  upcoming_value: number;
  cancelled: number;
  /** Svolti con almeno un servizio senza prezzo: "speso" è quindi per difetto */
  unpriced_appointments: number;
}

export interface SummaryLifetime extends SummaryTotals {
  first_visit: string | null;
  last_visit: string | null;
}

export interface ClientSummary {
  client: Client;
  period: { from: string; to: string };
  period_totals: SummaryTotals;
  lifetime: SummaryLifetime;
  by_service: { service_id: number; name: string; count: number; spent: number }[];
  /** Ultimi 12 mesi, sempre 12 elementi */
  by_month: { month: string; appointments: number; spent: number }[];
  appointments: Appointment[];
}
