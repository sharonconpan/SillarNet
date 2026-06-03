export const CLASS_LABELS: Record<string, string> = {
  buen_estado: "Buen Estado",
  suciedad_leve: "Suciedad Leve",
  suciedad_grave: "Suciedad Grave",
  deterioro_leve: "Deterioro Leve",
  deterioro_grave: "Deterioro Grave",
};

export const CLASS_COLORS: Record<string, string> = {
  buen_estado:    "#5E8A5C",
  suciedad_leve:  "#C9973A",
  suciedad_grave: "#C07030",
  deterioro_leve: "#B84020",
  deterioro_grave:"#7C1D12",
};

export const CLASS_ICONS: Record<string, string> = {
  buen_estado: "✅",
  suciedad_leve: "🟡",
  suciedad_grave: "🟠",
  deterioro_leve: "🔴",
  deterioro_grave: "🚨",
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
