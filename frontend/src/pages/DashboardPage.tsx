import { lazy, Suspense, useState } from "react";
import { useHeatmap, useMarkers } from "@/hooks/useMapData";
import { useAuthStore } from "@/store/authStore";

const ArequipaMap = lazy(() => import("@/components/map/ArequipaMap"));

const FILTERS = [
  { id: "all",       label: "Todos",     color: "#78614A" },
  { id: "ninguno",   label: "Ninguno",   color: "#5E8A5C" },
  { id: "suciedad",  label: "Suciedad",  color: "#C07030" },
  { id: "deterioro", label: "Deterioro", color: "#B84020" },
] as const;

type FilterId = typeof FILTERS[number]["id"];

const LEGEND = [
  { color: "#5E8A5C", label: "Ninguno" },
  { color: "#C9973A", label: "Suciedad leve" },
  { color: "#C07030", label: "Suciedad grave" },
  { color: "#B84020", label: "Deterioro leve" },
  { color: "#7C1D12", label: "Deterioro grave" },
];

export default function DashboardPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: heatmapData, isLoading: heatLoading } = useHeatmap();
  const { data: markersData, isLoading: markersLoading } = useMarkers();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const mapHeight = isAuthenticated
    ? "h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-3.5rem)]"
    : "h-[calc(100dvh-3.5rem)]";

  const filteredMarkers = (markersData?.markers ?? []).filter((m) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "ninguno") return m.predicted_class === "ninguno";
    return m.predicted_class.startsWith(activeFilter);
  });

  const heatPoints = activeFilter === "all" ? (heatmapData?.points ?? []) : [];

  // All stats derived from filteredMarkers
  const filteredTotal  = filteredMarkers.length;
  const deterioroCount = filteredMarkers.filter((m) => m.predicted_class.startsWith("deterioro")).length;
  const suciedadCount  = filteredMarkers.filter((m) => m.predicted_class.startsWith("suciedad")).length;
  const detPct         = filteredTotal > 0 ? Math.round((deterioroCount / filteredTotal) * 100) : 0;
  const sucPct         = filteredTotal > 0 ? Math.round((suciedadCount  / filteredTotal) * 100) : 0;

  const sucLeveCount  = filteredMarkers.filter((m) => m.predicted_class === "suciedad_leve").length;
  const sucGraveCount = filteredMarkers.filter((m) => m.predicted_class === "suciedad_grave").length;
  const sucLevePct    = filteredTotal > 0 ? Math.round((sucLeveCount  / filteredTotal) * 100) : 0;
  const sucGravePct   = filteredTotal > 0 ? Math.round((sucGraveCount / filteredTotal) * 100) : 0;

  const detLeveCount  = filteredMarkers.filter((m) => m.predicted_class === "deterioro_leve").length;
  const detGraveCount = filteredMarkers.filter((m) => m.predicted_class === "deterioro_grave").length;
  const detLevePct    = filteredTotal > 0 ? Math.round((detLeveCount  / filteredTotal) * 100) : 0;
  const detGravePct   = filteredTotal > 0 ? Math.round((detGraveCount / filteredTotal) * 100) : 0;

  type StatCard = { label: string; value: string; accent: string; wide?: boolean };

  function getStatsCards(): StatCard[] {
    const totalCard: StatCard = { label: "Total", value: String(filteredTotal), accent: "#78614A" };
    if (activeFilter === "all") {
      return [
        totalCard,
        { label: "Con deterioro", value: `${detPct}%`,  accent: "#B84020" },
        { label: "Con suciedad",  value: `${sucPct}%`,  accent: "#C07030" },
      ];
    }
    if (activeFilter === "ninguno") {
      return [
        totalCard,
        {
          label: "Sin patologías detectadas bajo los parámetros establecidos",
          value: "",
          accent: "#5E8A5C",
          wide: true,
        },
      ];
    }
    if (activeFilter === "suciedad") {
      return [
        totalCard,
        { label: "Suciedad leve",  value: `${sucLevePct}%`,  accent: "#C9973A" },
        { label: "Suciedad grave", value: `${sucGravePct}%`, accent: "#C07030" },
      ];
    }
    // deterioro
    return [
      totalCard,
      { label: "Deterioro leve",  value: `${detLevePct}%`,  accent: "#B84020" },
      { label: "Deterioro grave", value: `${detGravePct}%`, accent: "#7C1D12" },
    ];
  }

  const statsCards = getStatsCards();

  type SummaryStat = { label: string; color: string };
  function getSummaryStats(): [SummaryStat, SummaryStat] | null {
    if (activeFilter === "all") return [
      { label: `${detPct}% deterioro`,  color: "#B84020" },
      { label: `${sucPct}% suciedad`,   color: "#C07030" },
    ];
    if (activeFilter === "suciedad") return [
      { label: `${sucLevePct}% leve`,  color: "#C9973A" },
      { label: `${sucGravePct}% grave`, color: "#C07030" },
    ];
    if (activeFilter === "deterioro") return [
      { label: `${detLevePct}% leve`,  color: "#B84020" },
      { label: `${detGravePct}% grave`, color: "#7C1D12" },
    ];
    return null;
  }
  const summaryStats = getSummaryStats();

  return (
    <div className={`relative bg-stone-100 ${mapHeight}`}>

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
                  {filteredTotal > 0 ? `${filteredTotal} registros` : "Sin datos aún"}
                </span>
                {filteredTotal > 0 && (
                  <span className="text-[11px] text-stone-400 font-medium">analizados</span>
                )}
              </div>

              {!sheetOpen && summaryStats && (
                <div className="flex items-center gap-3">
                  {summaryStats.map((s) => (
                    <span key={s.label} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[11px] text-stone-500 font-medium">{s.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              sheetOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-5 pb-8 space-y-5">
              <div className="grid grid-cols-3 gap-2.5">
                {statsCards.map(({ label, value, accent, wide }) => (
                  <div
                    key={label}
                    className={`rounded-2xl px-3 py-3 text-center ${wide ? "col-span-2" : ""}`}
                    style={{ backgroundColor: `${accent}0f` }}
                  >
                    {wide ? (
                      <p className="text-[11px] leading-snug font-medium" style={{ color: accent }}>
                        {label}
                      </p>
                    ) : (
                      <>
                        <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-wider leading-tight">
                          {label}
                        </p>
                      </>
                    )}
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
