export interface StatsPeriod {
  from: string;
  to: string;
  days: number;
  previous_from: string;
  previous_to: string;
}

export interface StatsTotals {
  appointments: number;
  active: number;
  by_status: { pending: number; confirmed: number; completed: number; cancelled: number };
  cancellation_rate: number;
  booked_minutes: number;
  booked_hours: number;
  avg_duration_minutes: number;
  avg_per_day: number;
}

export interface StatsComparison {
  previous_appointments: number;
  previous_active: number;
  /** null = periodo precedente vuoto, niente da confrontare */
  appointments_change_percent: number | null;
  active_change_percent: number | null;
}

export interface StatsDay {
  date: string;
  appointments: number;
  cancelled: number;
}

export interface StatsStaff {
  staff_id: number;
  name: string;
  appointments: number;
  minutes: number;
  hours: number;
}

export interface StatsService {
  service_id: number;
  name: string;
  color: string | null;
  duration_minutes: number;
  count: number;
  minutes: number;
}

export interface StatsWeekday {
  /** 1 = lunedì ... 7 = domenica */
  weekday: number;
  appointments: number;
}

export interface StatsHour {
  hour: number;
  appointments: number;
}

export interface StatsTopClient {
  client_id: number;
  name: string;
  phone: string;
  appointments: number;
}

export interface StatsClients {
  total: number;
  new: number;
  served: number;
  returning: number;
  top: StatsTopClient[];
}

export interface Stats {
  period: StatsPeriod;
  totals: StatsTotals;
  comparison: StatsComparison;
  per_day: StatsDay[];
  by_staff: StatsStaff[];
  by_service: StatsService[];
  by_weekday: StatsWeekday[];
  by_hour: StatsHour[];
  clients: StatsClients;
  to_schedule: number;
}
