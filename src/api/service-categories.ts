import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ServiceCategory } from "@/types";

export interface ServiceCategoryInput {
  name: string;
  parent_id?: number | null;
}

export const categoryKeys = { all: ["service-categories"] as const };

/** Albero categoria > sottocategoria con i servizi dentro (i servizi senza categoria non ci sono). */
export function useServiceCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: async () => (await api.get<{ data: ServiceCategory[] }>("/service-categories")).data.data,
    staleTime: 60_000,
  });
}

export function useSaveServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ServiceCategoryInput & { id?: number }) => {
      const res = id
        ? await api.put<{ data: ServiceCategory }>(`/service-categories/${id}`, input)
        : await api.post<{ data: ServiceCategory }>("/service-categories", input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useDeleteServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/service-categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
}
