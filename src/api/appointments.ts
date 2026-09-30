import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Appointment, AppointmentStatus, DashboardStats } from "@/types";

export interface AppointmentListParams {
  from?: string;
  to?: string;
  status?: AppointmentStatus;
  staff_id?: number;
  client_id?: number;
  include_undated?: boolean;
}

export interface AppointmentInput {
  client_id?: number;
  client?: { phone: string; first_name?: string | null; last_name?: string | null };
  staff_id?: number;
  service_ids?: number[];
  scheduled_at?: string | null;
  notes?: string | null;
  status?: AppointmentStatus;
}

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: (p: AppointmentListParams) => ["appointments", "list", p] as const,
  toSchedule: ["appointments", "to-schedule"] as const,
};

export function useAppointments(params: AppointmentListParams, enabled = true) {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: async () =>
      (
        await api.get<{ data: Appointment[] }>("/appointments", {
          params: { ...params, include_undated: params.include_undated ? 1 : undefined },
        })
      ).data.data,
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useToSchedule() {
  return useQuery({
    queryKey: appointmentKeys.toSchedule,
    queryFn: async () => (await api.get<{ data: Appointment[] }>("/appointments/to-schedule")).data.data,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardStats>("/dashboard")).data,
  });
}

function useInvalidateAppointments() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: appointmentKeys.all });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["clients"] });
  };
}

export function useCreateAppointment() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async (input: AppointmentInput) =>
      (await api.post<{ data: Appointment }>("/appointments", input)).data.data,
    onSuccess: invalidate,
  });
}

export function useUpdateAppointment() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async ({ id, ...input }: AppointmentInput & { id: number }) =>
      (await api.put<{ data: Appointment }>(`/appointments/${id}`, input)).data.data,
    onSuccess: invalidate,
  });
}

export function useDeleteAppointment() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/appointments/${id}`);
    },
    onSuccess: invalidate,
  });
}

export type WhatsAppType = "confirmation" | "reminder";

export async function fetchWhatsAppUrl(id: number, type: WhatsAppType): Promise<string> {
  const { data } = await api.get<{ url: string }>(`/appointments/${id}/whatsapp/${type}`);
  return data.url;
}

/** Recupera il link e lo apre. Su mobile/PWA usa la stessa scheda per non farlo bloccare. */
export function openExternal(url: string) {
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) window.location.href = url;
}

export function useSendWhatsApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type }: { id: number; type: WhatsAppType }) => fetchWhatsAppUrl(id, type),
    onSuccess: (url, { type }) => {
      if (type === "confirmation") qc.invalidateQueries({ queryKey: appointmentKeys.all });
      openExternal(url);
    },
  });
}
