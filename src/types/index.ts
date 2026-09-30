export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Client {
  id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  notes: string | null;
  created_at: string | null;
}

export interface Service {
  id: number;
  name: string;
  color: string | null;
  duration_minutes: number;
}

export interface Staff {
  id: number;
  name: string;
}

export interface Appointment {
  id: number;
  scheduled_at: string | null;
  ends_at: string | null;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string | null;
  whatsapp_sent: boolean;
  client_id: number;
  staff_id: number;
  client?: Client;
  staff?: Staff;
  services?: Service[];
  created_at: string | null;
}

export interface DashboardStats {
  today: number;
  tomorrow: number;
  week: number;
  to_schedule: number;
  confirmed: number;
}

export interface Paginated<T> {
  data: T[];
  links: Record<string, string | null>;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export interface ValidationErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}
