import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Staff } from "@/types";

export interface StaffInput {
  name: string;
}

export const staffKeys = { all: ["staff"] as const };

export function useStaff() {
  return useQuery({
    queryKey: staffKeys.all,
    queryFn: async () => (await api.get<{ data: Staff[] }>("/staff")).data.data,
    staleTime: 60_000,
  });
}

export function useSaveStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: StaffInput & { id?: number }) => {
      const res = id ? await api.put<{ data: Staff }>(`/staff/${id}`, input) : await api.post<{ data: Staff }>("/staff", input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/staff/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
