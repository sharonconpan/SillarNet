import { useQuery } from "@tanstack/react-query";
import { mapApi } from "@/api/map";

export function useHeatmap() {
  return useQuery({
    queryKey: ["map", "heatmap"],
    queryFn: mapApi.heatmap,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useMarkers() {
  return useQuery({
    queryKey: ["map", "markers"],
    queryFn: mapApi.markers,
    staleTime: 5 * 60 * 1000,
  });
}
