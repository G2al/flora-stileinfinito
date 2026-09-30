import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Stats } from "@/types/stats";

export const statsKeys = { range: (from: string, to: string) => ["stats", from, to] as const };

/** Statistiche del periodo (from/to: yyyy-MM-dd, estremi inclusi). */
export function useStats(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: statsKeys.range(from, to),
    queryFn: async () => (await api.get<Stats>("/stats", { params: { from, to } })).data,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled,
  });
}
