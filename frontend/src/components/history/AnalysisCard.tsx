import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { CLASS_COLORS, CLASS_ICONS, CLASS_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { AnalysisSummary } from "@/api/analysis";

interface Props {
  analysis: AnalysisSummary;
}

export default function AnalysisCard({ analysis: a }: Readonly<Props>) {
  const label = CLASS_LABELS[a.predicted_class] ?? a.predicted_class;

  const hasDeterio = a.deterioro_clase != null && a.deterioro_clase !== "ninguno";
  const hasSuciedad = a.suciedad_clase != null && a.suciedad_clase !== "ninguno";
  const isClean = !hasDeterio && !hasSuciedad;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-36 bg-stone-100">
        <img src={a.stored_image_url} alt={label} className="w-full h-full object-cover" />

        {isClean ? (
          <span
            className="absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm"
            style={{ background: CLASS_COLORS.ninguno }}
          >
            {CLASS_ICONS.ninguno} {CLASS_LABELS.ninguno}
          </span>
        ) : (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDeterio && (
              <span
                className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm self-start"
                style={{ background: CLASS_COLORS[`deterioro_${a.deterioro_clase}`] }}
              >
                {CLASS_ICONS[`deterioro_${a.deterioro_clase}`]} {CLASS_LABELS[`deterioro_${a.deterioro_clase}`]}
              </span>
            )}
            {hasSuciedad && (
              <span
                className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm self-start"
                style={{ background: CLASS_COLORS[`suciedad_${a.suciedad_clase}`] }}
              >
                {CLASS_ICONS[`suciedad_${a.suciedad_clase}`]} {CLASS_LABELS[`suciedad_${a.suciedad_clase}`]}
              </span>
            )}
          </div>
        )}

        {a.re_analyze_suggested && (
          <span className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <RotateCcw className="w-2.5 h-2.5" />
            Re-analizar
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: (STATUS_COLORS[a.status] ?? "#9ca3af") + "22",
              color: STATUS_COLORS[a.status] ?? "#9ca3af",
            }}
          >
            {STATUS_LABELS[a.status] ?? a.status}
          </span>
          <span className="text-[10px] text-stone-400 flex-shrink-0">{formatDate(a.created_at)}</span>
        </div>

        {a.location_label && (
          <p className="text-[10px] text-stone-500 truncate">📍 {a.location_label}</p>
        )}

        <p className="text-[10px] text-stone-400">Confianza: {a.confidence}%</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-auto pt-1 border-t border-stone-50">
          <Link
            to={`/history/${a.id}`}
            className="text-[10px] text-brand-600 font-semibold hover:underline"
          >
            Ver detalle
          </Link>
          {a.re_analyze_suggested && (
            <Link to="/analyze" className="text-[10px] text-amber-600 font-semibold hover:underline">
              Re-analizar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
