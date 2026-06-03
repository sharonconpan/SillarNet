import client from "./client";

export interface Top5Item {
  clase: string;
  probabilidad: number;
}

export interface Analysis {
  id: string;
  predicted_class: string;
  confidence: number;
  color: string;
  urgency: string;
  recommendation: string;
  is_deterioration: boolean;
  top5: Top5Item[];
  stored_image_url: string;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  status: "pending" | "in_progress" | "completed" | "closed";
  re_analyze_suggested: boolean;
  notes: string | null;
  created_at: string;
}

export interface AnalysisSummary extends Omit<Analysis, "top5" | "recommendation"> {}

export interface PaginatedAnalyses {
  items: AnalysisSummary[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const analysisApi = {
  analyze: (file: File, lat?: number, lng?: number, locationLabel?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (lat !== undefined) form.append("latitude", String(lat));
    if (lng !== undefined) form.append("longitude", String(lng));
    if (locationLabel) form.append("location_label", locationLabel);
    return client.post<Analysis>("/analyses/analizar", form).then((r) => r.data);
  },

  list: (status?: string, page = 1, limit = 12) =>
    client
      .get<PaginatedAnalyses>("/analyses/", { params: { status, page, limit } })
      .then((r) => r.data),

  get: (id: string) =>
    client.get<Analysis>(`/analyses/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: "pending" | "in_progress" | "completed" | "closed") =>
    client.patch<Analysis>(`/analyses/${id}/status`, { status }).then((r) => r.data),

  updateNotes: (id: string, notes: string) =>
    client.patch<Analysis>(`/analyses/${id}/notes`, { notes }).then((r) => r.data),
};
