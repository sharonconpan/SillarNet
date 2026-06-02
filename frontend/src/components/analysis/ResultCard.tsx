import { CLASS_ICONS, CLASS_LABELS } from "@/lib/constants";
import type { Analysis } from "@/api/analysis";

interface Props {
  analysis: Analysis;
}

export default function ResultCard({ analysis }: Props) {
  const icon = CLASS_ICONS[analysis.predicted_class] ?? "❓";
  const label = CLASS_LABELS[analysis.predicted_class] ?? analysis.predicted_class;

  return (
    <div
      className="rounded-xl p-5 text-white flex items-center gap-4"
      style={{ background: analysis.color }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.25)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-lg leading-tight">{label.toUpperCase()}</p>
        <p className="text-sm opacity-90 mt-0.5">{analysis.urgency}</p>
        <div className="mt-2">
          <div className="bg-white/30 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/80 transition-all duration-700"
              style={{ width: `${analysis.confidence}%` }}
            />
          </div>
          <p className="text-xs mt-1 opacity-80">Confianza: {analysis.confidence}%</p>
        </div>
      </div>
    </div>
  );
}
