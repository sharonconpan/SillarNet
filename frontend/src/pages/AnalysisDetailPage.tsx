import { useParams, useNavigate } from "react-router-dom";
import { useAnalysis, useUpdateStatus, useUpdateNotes } from "@/hooks/useAnalyses";
import { CLASS_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, MapPin, Calendar, Cpu } from "lucide-react";
import { useState } from "react";
import ResultCard from "@/components/analysis/ResultCard";

type StatusKey = "pending" | "in_progress" | "completed" | "closed";

const STATUS_ACTIONS: Record<StatusKey, { label: string; next: StatusKey }[]> = {
  pending:     [{ label: "Iniciar",   next: "in_progress" }, { label: "Cerrar", next: "closed" }],
  in_progress: [{ label: "Completar", next: "completed"   }, { label: "Cerrar", next: "closed" }],
  completed:   [{ label: "Reabrir",   next: "pending"     }],
  closed:      [{ label: "Reabrir",   next: "pending"     }],
};

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: analysis, isLoading, isError } = useAnalysis(id ?? "");
  const { mutate: updateStatus, isPending: statusPending } = useUpdateStatus();
  const { mutate: updateNotes, isPending: notesPending }   = useUpdateNotes();
  const [notes, setNotes] = useState<string>("");
  const [notesInit, setNotesInit] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-stone-500 text-sm">No se encontró el análisis.</p>
        <button onClick={() => navigate("/history")} className="text-brand-600 text-sm font-medium">
          Volver al historial
        </button>
      </div>
    );
  }

  if (!notesInit) {
    setNotes(analysis.notes ?? "");
    setNotesInit(true);
  }

  const actions = STATUS_ACTIONS[analysis.status as StatusKey] ?? [];

  return (
    <div className="min-h-screen bg-stone-50 pb-28 md:pb-12">

      <div className="sticky top-14 z-40 bg-stone-50/95 backdrop-blur-sm border-b border-stone-100 px-4 py-3 flex items-center gap-3 max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 bg-white hover:border-brand-400 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-stone-600" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-stone-800 truncate">
            {CLASS_LABELS[analysis.predicted_class] ?? analysis.predicted_class}
          </h1>
          <p className="text-xs text-stone-400">{formatDate(analysis.created_at)}</p>
        </div>
        <span
          className="ml-auto flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: (STATUS_COLORS[analysis.status] ?? "#9ca3af") + "22",
            color: STATUS_COLORS[analysis.status] ?? "#9ca3af",
          }}
        >
          {STATUS_LABELS[analysis.status] ?? analysis.status}
        </span>
      </div>

      <div className="px-4 pt-4 max-w-2xl mx-auto space-y-4">

        <div className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm bg-stone-100">
          <img
            src={analysis.stored_image_url}
            alt={CLASS_LABELS[analysis.predicted_class]}
            className="w-full max-h-72 object-cover"
          />
        </div>

        <ResultCard analysis={analysis} />

        {/* ── Recommendation ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Recomendación</p>
          <p className="text-sm text-stone-700 leading-relaxed">{analysis.recommendation}</p>
        </div>

        {/* ── Metadata ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Información</p>
          <div className="space-y-2.5">
            {analysis.location_label && (
              <div className="flex items-start gap-2.5 text-sm text-stone-600">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-stone-400" />
                <span>{analysis.location_label}</span>
              </div>
            )}
            {(analysis.latitude != null && analysis.longitude != null) && (
              <div className="flex items-center gap-2.5 text-xs text-stone-500 font-mono">
                <MapPin className="w-4 h-4 flex-shrink-0 text-stone-300" />
                {analysis.latitude.toFixed(5)}, {analysis.longitude.toFixed(5)}
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm text-stone-600">
              <Calendar className="w-4 h-4 flex-shrink-0 text-stone-400" />
              {formatDate(analysis.created_at)}
            </div>
            <div className="flex items-center gap-2.5 text-sm text-stone-600">
              <Cpu className="w-4 h-4 flex-shrink-0 text-stone-400" />
              Modelo SillarNet · {analysis.confidence.toFixed(1)}% confianza
            </div>
          </div>
        </div>

        {/* ── Notes ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Notas</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agrega observaciones sobre este análisis…"
            rows={3}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-all"
          />
          <button
            onClick={() => updateNotes({ id: analysis.id, notes })}
            disabled={notesPending || notes === (analysis.notes ?? "")}
            className="h-10 px-5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 transition-all"
          >
            {notesPending ? "Guardando…" : "Guardar notas"}
          </button>
        </div>

        {/* ── Status actions ─────────────────────────────────────── */}
        {actions.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Cambiar estado</p>
            <div className="flex flex-wrap gap-3">
              {actions.map(({ label, next }) => (
                <button
                  key={next}
                  onClick={() => updateStatus({ id: analysis.id, status: next })}
                  disabled={statusPending}
                  className="h-10 px-5 border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50 transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
