import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { CLASS_ICONS, CLASS_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { AnalysisSummary } from "@/api/analysis";
import { useUpdateStatus } from "@/hooks/useAnalyses";

interface Props {
  analysis: AnalysisSummary;
}

const STATUS_ACTIONS: Record<string, { label: string; next: "pending" | "discarded" | "completed" }[]> = {
  pending: [
    { label: "Completar", next: "completed" },
    { label: "Descartar", next: "discarded" },
  ],
  discarded: [{ label: "Restaurar", next: "pending" }],
  completed: [{ label: "Reabrir", next: "pending" }],
};

export default function AnalysisCard({ analysis: a }: Props) {
  const { mutate: updateStatus, isPending } = useUpdateStatus();
  const icon = CLASS_ICONS[a.predicted_class] ?? "❓";
  const label = CLASS_LABELS[a.predicted_class] ?? a.predicted_class;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-36 bg-gray-100">
        <img
          src={a.stored_image_url}
          alt={label}
          className="w-full h-full object-cover"
        />
        <span
          className="absolute top-2 left-2 text-xs font-semibold text-white px-2 py-0.5 rounded-full"
          style={{ background: a.color }}
        >
          {icon} {label}
        </span>
        {a.re_analyze_suggested && (
          <span className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            Re-analizar
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: STATUS_COLORS[a.status] + "22",
              color: STATUS_COLORS[a.status],
            }}
          >
            {STATUS_LABELS[a.status]}
          </span>
          <span className="text-xs text-gray-400">{formatDate(a.created_at)}</span>
        </div>

        {a.location_label && (
          <p className="text-xs text-gray-500 truncate">📍 {a.location_label}</p>
        )}

        <p className="text-xs text-gray-500">Confianza: {a.confidence}%</p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1 flex-wrap">
          <Link
            to={`/history/${a.id}`}
            className="text-xs text-brand-600 hover:underline"
          >
            Ver detalle
          </Link>
          {(STATUS_ACTIONS[a.status] ?? []).map(({ label: actionLabel, next }) => (
            <button
              key={next}
              onClick={() => updateStatus({ id: a.id, status: next })}
              disabled={isPending}
              className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-50 transition-colors"
            >
              {actionLabel}
            </button>
          ))}
          {a.re_analyze_suggested && (
            <Link
              to="/analyze"
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              Re-analizar sitio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
