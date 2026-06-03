import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analysisApi } from "@/api/analysis";

export function useAnalyses(status?: string, page = 1) {
  return useQuery({
    queryKey: ["analyses", status, page],
    queryFn: () => analysisApi.list(status, page),
  });
}

export function useAnalysis(id: string) {
  return useQuery({
    queryKey: ["analyses", id],
    queryFn: () => analysisApi.get(id),
    enabled: !!id,
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "pending" | "in_progress" | "completed" | "closed" }) =>
      analysisApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analyses"] });
      qc.invalidateQueries({ queryKey: ["map"] });
    },
  });
}

export function useUpdateNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      analysisApi.updateNotes(id, notes),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["analyses", vars.id] });
    },
  });
}
