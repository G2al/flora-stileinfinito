import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Service } from "@/types";

export interface ServiceInput {
  name: string;
  color?: string | null;
  duration_minutes: number;
}

export const serviceKeys = { all: ["services"] as const };

export function useServices() {
  return useQuery({
    queryKey: serviceKeys.all,
    queryFn: async () => (await api.get<{ data: Service[] }>("/services")).data.data,
    staleTime: 60_000,
  });
}

export function useSaveService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ServiceInput & { id?: number }) => {
      const res = id
        ? await api.put<{ data: Service }>(`/services/${id}`, input)
        : await api.post<{ data: Service }>("/services", input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.all });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/services/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.all });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
