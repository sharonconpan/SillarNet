import { lazy, Suspense } from "react";
import { useHeatmap, useMarkers } from "@/hooks/useMapData";

// Lazy-load map to avoid leaflet SSR issues
const ArequipaMap = lazy(() => import("@/components/map/ArequipaMap"));

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: heatmapData, isLoading: heatLoading } = useHeatmap();
  const { data: markersData, isLoading: markersLoading } = useMarkers();

  const total = heatmapData?.total ?? 0;
  const deteriorationCount = heatmapData?.deterioration_count ?? 0;
  const criticalCount = heatmapData?.critical_count ?? 0;
  const detPct = total > 0 ? Math.round((deteriorationCount / total) * 100) : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Stats bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-sm font-semibold text-gray-700 mb-2">
            Centro Histórico de Arequipa — Monitoreo en tiempo real
          </h1>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
            <StatCard label="Registros" value={total} sub="imágenes con ubicación" />
            <StatCard
              label="Con deterioro"
              value={`${detPct}%`}
              sub={`${deteriorationCount} estructuras`}
            />
            <StatCard
              label="Críticos"
              value={criticalCount}
              sub="deterioro grave"
            />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {(heatLoading || markersLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 text-sm text-gray-500">
            Cargando mapa...
          </div>
        )}
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
              Iniciando mapa...
            </div>
          }
        >
          <ArequipaMap
            heatPoints={heatmapData?.points ?? []}
            markers={markersData?.markers ?? []}
          />
        </Suspense>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center gap-4 text-xs text-gray-500 flex-wrap">
          <span className="font-medium text-gray-700">Escala de deterioro:</span>
          {[
            { color: "#2ecc71", label: "Buen estado" },
            { color: "#f1c40f", label: "Suciedad leve" },
            { color: "#e67e22", label: "Suciedad grave" },
            { color: "#e74c3c", label: "Deterioro leve" },
            { color: "#8e44ad", label: "Deterioro grave" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
