import { lazy, Suspense, useState } from "react";
import { useHeatmap, useMarkers } from "@/hooks/useMapData";

const ArequipaMap = lazy(() => import("@/components/map/ArequipaMap"));

const FILTERS = [
  { id: "all",             label: "Todos",          color: "#78614A" },
  { id: "buen_estado",     label: "Buen estado",    color: "#5E8A5C" },
  { id: "suciedad",        label: "Suciedad",       color: "#C07030" },
  { id: "deterioro_leve",  label: "Deterioro leve", color: "#B84020" },
  { id: "deterioro_grave", label: "Crítico",        color: "#7C1D12" },
] as const;

type FilterId = typeof FILTERS[number]["id"];

const LEGEND = [
  { color: "#5E8A5C", label: "Buen estado" },
  { color: "#C9973A", label: "Suciedad leve" },
  { color: "#C07030", label: "Suciedad grave" },
  { color: "#B84020", label: "Deterioro leve" },
  { color: "#7C1D12", label: "Crítico" },
];

export default function DashboardPage() {
  const { data: heatmapData, isLoading: heatLoading } = useHeatmap();
  const { data: markersData, isLoading: markersLoading } = useMarkers();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const total             = heatmapData?.total ?? 0;
  const deteriorationCount = heatmapData?.deterioration_count ?? 0;
  const criticalCount     = heatmapData?.critical_count ?? 0;
  const detPct            = total > 0 ? Math.round((deteriorationCount / total) * 100) : 0;

  const filteredMarkers = (markersData?.markers ?? []).filter((m) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "suciedad") return m.predicted_class.startsWith("suciedad");
    return m.predicted_class === activeFilter;
  });

  const heatPoints = activeFilter === "all" ? (heatmapData?.points ?? []) : [];

  return (
    <div className="relative h-[calc(100vh-3.5rem)] bg-stone-100">

      <div className="absolute inset-0 overflow-hidden">
        {(heatLoading || markersLoading) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100 z-10 gap-3">
            <div className="w-8 h-8 rounded-full border-[3px] border-brand-500 border-t-transparent animate-spin" />
            <p className="text-sm text-stone-500 font-medium tracking-wide">Cargando mapa…</p>
          </div>
        )}
        <Suspense fallback={null}>
          <ArequipaMap heatPoints={heatPoints} markers={filteredMarkers} />
        </Suspense>
      </div>

      <div className="absolute top-3 inset-x-3 z-[1000] flex flex-col gap-2 pointer-events-none">

        <div className="pointer-events-auto bg-white/88 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/[0.12] border border-white/70 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.15em]">
              Monitoreo patrimonial
            </p>
            <h1 className="text-[15px] font-bold text-stone-800 leading-snug mt-0.5">
              Centro Histórico · Arequipa
            </h1>
          </div>
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            EN VIVO
          </span>
        </div>

        <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {FILTERS.map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold shadow-sm transition-all duration-200 active:scale-95 ${
                  active
                    ? "text-white shadow-md scale-[1.04]"
                    : "bg-white/88 backdrop-blur-xl text-stone-600 border border-white/60 hover:bg-white"
                }`}
                style={active ? { backgroundColor: f.color, boxShadow: `0 4px 14px ${f.color}55` } : {}}
              >
                {f.id !== "all" && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: active ? "rgba(255,255,255,0.65)" : f.color }}
                  />
                )}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`absolute bottom-0 inset-x-0 z-[1000] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          sheetOpen ? "translate-y-0" : "translate-y-[calc(100%-5rem)]"
        }`}
      >
        <div className="bg-white/95 backdrop-blur-2xl rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.14)] border-t border-white/60">

          <button
            onClick={() => setSheetOpen((o) => !o)}
            className="w-full px-5 pt-3 pb-[2.1rem] flex flex-col items-center gap-2.5 active:opacity-80 transition-opacity"
            aria-label={sheetOpen ? "Cerrar panel" : "Abrir panel"}
          >
            <span className="w-9 h-[3px] bg-stone-200 rounded-full" />

            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-stone-800">
                  {total > 0 ? `${total} registros` : "Sin datos aún"}
                </span>
                {total > 0 && (
                  <span className="text-[11px] text-stone-400 font-medium">analizados</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#B84020" }} />
                  <span className="text-[11px] text-stone-500 font-medium">{deteriorationCount} deterioro</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7C1D12" }} />
                  <span className="text-[11px] text-stone-500 font-medium">{criticalCount} crítico</span>
                </span>
              </div>
            </div>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              sheetOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-5 pb-8 space-y-5">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "Total",         value: String(total),         accent: "#78614A" },
                  { label: "Con deterioro", value: `${detPct}%`,          accent: "#B84020" },
                  { label: "Críticos",      value: String(criticalCount), accent: "#7C1D12" },
                ].map(({ label, value, accent }) => (
                  <div
                    key={label}
                    className="rounded-2xl px-3 py-3 text-center"
                    style={{ backgroundColor: `${accent}0f` }}
                  >
                    <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-wider leading-tight">{label}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em] mb-2.5">
                  Escala de deterioro
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {LEGEND.map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1.5 text-[12px] text-stone-600 font-medium">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
        <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} className="bg-white/95" />
      </div>
    </div>
  );
}
