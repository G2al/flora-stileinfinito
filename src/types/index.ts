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

export interface ServiceCategoryRef {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface Service {
  id: number;
  name: string;
  color: string | null;
  /** null = durata non specificata */
  duration_minutes: number | null;
  /** Listino in euro, null = nessun prezzo */
  price: number | null;
  category_id: number | null;
  category: ServiceCategoryRef | null;
}

/** Albero a due livelli (categoria > sottocategoria), con i servizi dentro. */
export interface ServiceCategory {
  id: number;
  name: string;
  parent_id: number | null;
  children: ServiceCategory[];
  services: Service[];
}

/** Servizio dentro un appuntamento: price è il prezzo APPLICATO, default_price il listino attuale. */
export interface AppointmentService {
  id: number;
  name: string;
  color: string | null;
  category_id: number | null;
  duration_minutes: number | null;
  price: number | null;
  default_price: number | null;
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
  services?: AppointmentService[];
  /** Somma dei prezzi applicati */
  total_price?: number;
  /** Quanti servizi non hanno prezzo */
  unpriced_services?: number;
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
