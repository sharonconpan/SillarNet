import { CLASS_LABELS } from "@/lib/constants";

type Level = "grave" | "leve" | "none";

const LEVEL_CFG: Record<Level, { bg: string; border: string; text: string }> = {
  grave: { bg: "#7C1D1212", border: "#7C1D12", text: "#7C1D12" },
  leve:  { bg: "#B8402012", border: "#B84020", text: "#B84020" },
  none:  { bg: "#5E8A5C12", border: "#5E8A5C", text: "#3D6B40" },
};

const LEVEL_LABEL: Record<Level, string> = {
  grave: "Grave",
  leve:  "Leve",
  none:  "Sin detectar",
};

function assessDim(clase: string | null): Level {
  if (clase === "grave") return "grave";
  if (clase === "leve") return "leve";
  return "none";
}

interface ResultData {
  predicted_class: "ninguno" | "deterioro" | "suciedad";
  color: string;
  urgency: string;
  deterioro_clase: string | null;
  deterioro_indice: number | null;
  suciedad_clase: string | null;
  suciedad_indice: number | null;
}

interface Props {
  readonly analysis: ResultData;
}

interface DimCardProps {
  title: string;
  level: Level;
  indice: number;
}

function DimCard({ title, level, indice }: Readonly<DimCardProps>) {
  const cfg = LEVEL_CFG[level];
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 border"
      style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.text }}>
        {title}
      </p>
      <p className="text-sm font-bold" style={{ color: cfg.text }}>
        {LEVEL_LABEL[level]}
      </p>
      {level === "none" ? (
        <p className="text-[10px] leading-snug" style={{ color: cfg.text, opacity: 0.7 }}>
          Bajo los parámetros mínimos establecidos
        </p>
      ) : (
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span style={{ color: cfg.text, opacity: 0.7 }}>Índice</span>
            <span className="font-bold" style={{ color: cfg.text }}>{Math.round(indice)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${indice}%`, backgroundColor: cfg.border }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultCard({ analysis }: Props) {
  const { predicted_class, color, urgency } = analysis;
  const detLevel = assessDim(analysis.deterioro_clase);
  const sucLevel = assessDim(analysis.suciedad_clase);

  return (
    <div className="space-y-3">

      {/* ── Diagnosis card ── */}
      <div
        className="rounded-2xl p-4 border"
        style={{ backgroundColor: `${color}12`, borderColor: color }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>
          Diagnóstico
        </p>
        <p className="text-xl font-bold leading-tight" style={{ color }}>
          {CLASS_LABELS[predicted_class] ?? predicted_class}
        </p>
        <p className="text-xs mt-1.5 leading-snug" style={{ color, opacity: 0.75 }}>
          {urgency}
        </p>
      </div>

      {/* ── Dimension cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <DimCard title="Deterioro" level={detLevel} indice={analysis.deterioro_indice ?? 0} />
        <DimCard title="Suciedad"  level={sucLevel} indice={analysis.suciedad_indice  ?? 0} />
      </div>

    </div>
  );
}
