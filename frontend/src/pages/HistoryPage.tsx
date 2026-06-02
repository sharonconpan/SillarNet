import { useState } from "react";
import { useAnalyses } from "@/hooks/useAnalyses";
import AnalysisCard from "@/components/history/AnalysisCard";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Tab = "pending" | "discarded" | "completed";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "completed", label: "Completados" },
  { key: "discarded", label: "Descartados" },
];

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAnalyses(tab, page);

  function changeTab(t: Tab) {
    setTab(t);
    setPage(1);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona tus análisis de imágenes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => changeTab(key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === key
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            {label}
            {data && tab === key && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {data.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-red-500 text-sm">
          Error al cargar el historial.
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No hay registros {tab === "pending" ? "pendientes" : tab === "completed" ? "completados" : "descartados"}.
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.items.map((a) => (
              <AnalysisCard key={a.id} analysis={a} />
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-brand-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-brand-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
