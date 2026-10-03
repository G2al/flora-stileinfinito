import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { categoryKeys } from "@/api/service-categories";
import type { Service } from "@/types";

export interface ServiceInput {
  name: string;
  color?: string | null;
  /** 5-720, oppure null/omesso = nessuna durata */
  duration_minutes?: number | null;
  /** Listino in euro (>= 0), oppure null */
  price?: number | null;
  category_id?: number | null;
}

export const serviceKeys = { all: ["services"] as const };

/** Elenco servizi; con categoryId filtra per categoria e sue sottocategorie. */
export function useServices(categoryId?: number) {
  return useQuery({
    queryKey: [...serviceKeys.all, categoryId ?? "all"],
    queryFn: async () =>
      (await api.get<{ data: Service[] }>("/services", { params: { category_id: categoryId } })).data.data,
    staleTime: 60_000,
  });
}

function useInvalidateServices() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: serviceKeys.all });
    qc.invalidateQueries({ queryKey: categoryKeys.all });
    qc.invalidateQueries({ queryKey: ["appointments"] });
  };
}

export function useSaveService() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: async ({ id, ...input }: ServiceInput & { id?: number }) => {
      const res = id
        ? await api.put<{ data: Service }>(`/services/${id}`, input)
        : await api.post<{ data: Service }>("/services", input);
      return res.data.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteService() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/services/${id}`);
    },
    onSuccess: invalidate,
  });
}
