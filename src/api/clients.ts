import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Client, Paginated } from "@/types";

export interface ClientInput {
  first_name?: string | null;
  last_name?: string | null;
  phone: string;
  notes?: string | null;
}

export interface ClientListParams {
  q?: string;
  page?: number;
  per_page?: number;
}

export const clientKeys = {
  all: ["clients"] as const,
  list: (p: ClientListParams) => ["clients", "list", p] as const,
};

export function useClients(params: ClientListParams, enabled = true) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: async () =>
      (
        await api.get<Paginated<Client>>("/clients", {
          params: { q: params.q || undefined, page: params.page, per_page: params.per_page ?? 20 },
        })
      ).data,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useSaveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ClientInput & { id?: number }) => {
      const res = id
        ? await api.put<{ data: Client }>(`/clients/${id}`, input)
        : await api.post<{ data: Client }>("/clients", input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
