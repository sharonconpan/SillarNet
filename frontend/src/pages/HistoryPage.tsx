import { useState } from "react";
import { useAnalyses } from "@/hooks/useAnalyses";
import AnalysisCard from "@/components/history/AnalysisCard";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";

type Tab = "pending" | "in_progress" | "completed" | "closed";

const TAB_EMPTY: Record<Tab, string> = {
  pending:     "pendientes",
  in_progress: "en progreso",
  completed:   "completados",
  closed:   "archivados",
};

const TABS: { key: Tab; label: string; dot: string }[] = [
  { key: "pending",     label: "Pendientes",   dot: "#C9973A" },
  { key: "in_progress", label: "En progreso",  dot: "#0284C7" },
  { key: "completed",   label: "Completados",  dot: "#5E8A5C" },
  { key: "closed",   label: "Cerrados",     dot: "#9ca3af" },
];

export default function HistoryPage() {
  const [tab, setTab]   = useState<Tab>("pending");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAnalyses(tab, page);

  function changeTab(t: Tab) {
    setTab(t);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-28 md:pb-12">

      <div className="px-4 pt-6 pb-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Historial</h1>
        <p className="text-sm text-stone-400 mt-0.5">Gestiona tus análisis guardados</p>
      </div>

      <div className="px-4 max-w-6xl mx-auto mb-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map(({ key, label, dot }) => (
            <button
              key={key}
              onClick={() => changeTab(key)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150",
                tab === key
                  ? "bg-stone-800 text-white shadow-sm"
                  : "bg-white text-stone-500 border border-stone-200 hover:border-stone-300"
              )}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: tab === key ? "rgba(255,255,255,0.6)" : dot }}
              />
              {label}
              {data && tab === key && (
                <span className={cn(
                  "ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold",
                  "bg-white/20 text-inherit"
                )}>
                  {data.total}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto">
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={`skel-${i}`} className="h-52 bg-stone-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-12 text-red-500 text-sm">
            Error al cargar el historial.
          </div>
        )}

        {data?.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-stone-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-stone-500">Sin registros</p>
              <p className="text-xs text-stone-400 mt-0.5">
                No hay análisis {TAB_EMPTY[tab]} aún.
              </p>
            </div>
          </div>
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.items.map((a) => (
                <AnalysisCard key={a.id} analysis={a} />
              ))}
            </div>

            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-stone-200 bg-white disabled:opacity-30 hover:border-brand-400 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-stone-500 font-medium min-w-[80px] text-center">
                  {page} / {data.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-stone-200 bg-white disabled:opacity-30 hover:border-brand-400 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
