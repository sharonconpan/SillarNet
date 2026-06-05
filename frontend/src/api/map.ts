import client from "./client";

export interface HeatPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface MapMarker {
  lat: number;
  lng: number;
  predicted_class: string;
  color: string;
  location_label: string | null;
  created_at: string;
  stored_image_url: string | null;
  status: string | null;
  suciedad_clase: string | null;
  deterioro_clase: string | null;
}

export interface HeatmapResponse {
  points: HeatPoint[];
  total: number;
  deterioration_count: number;
  critical_count: number;
}

export interface MarkersResponse {
  markers: MapMarker[];
}

export const mapApi = {
  heatmap: () => client.get<HeatmapResponse>("/map/heatmap").then((r) => r.data),
  markers: () => client.get<MarkersResponse>("/map/markers").then((r) => r.data),
};
