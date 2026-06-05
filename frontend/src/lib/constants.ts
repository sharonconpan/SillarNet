export const CLASS_LABELS: Record<string, string> = {
  ninguno:   "Ninguno",
  deterioro: "Deterioro",
  suciedad:  "Suciedad",
};

export const CLASS_COLORS: Record<string, string> = {
  ninguno:   "#5E8A5C",
  deterioro: "#B84020",
  suciedad:  "#C07030",
};

export const CLASS_ICONS: Record<string, string> = {
  ninguno:   "✅",
  deterioro: "🔴",
  suciedad:  "🟠",
};

export const STATUS_LABELS: Record<string, string> = {
  pending:     "Pendiente",
  in_progress: "En progreso",
  completed:   "Completado",
  closed:      "Cerrado",
};

export const STATUS_COLORS: Record<string, string> = {
  pending:     "#C9973A",
  in_progress: "#0284C7",
  completed:   "#5E8A5C",
  closed:      "#9ca3af",
};

// Arequipa Plaza de Armas
export const AREQUIPA_CENTER: [number, number] = [-16.3989, -71.537];
export const AREQUIPA_ZOOM = 16;

export const HEATMAP_GRADIENT = {
  0.1:  "#5E8A5C",
  0.45: "#C9973A",
  0.75: "#B84020",
  1.0:  "#7C1D12",
};
