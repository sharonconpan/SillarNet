import { AlertTriangle } from "lucide-react";

interface Props {
  predictedClass: string;
  recommendation: string;
}

const MESSAGES: Record<string, string> = {
  deterioro_leve: "Deterioro estructural leve detectado — intervención prioritaria requerida.",
  deterioro_grave: "DETERIORO ESTRUCTURAL GRAVE — Intervención urgente. Restricción de acceso recomendada.",
};

export default function DeteriorationAlert({ predictedClass, recommendation }: Props) {
  if (!predictedClass.startsWith("deterioro")) return null;

  const isGrave = predictedClass === "deterioro_grave";

  return (
    <div
      className="rounded-xl border-2 p-4"
      style={{
        backgroundColor: isGrave ? "#7C1D1222" : "#B8402012",
        borderColor:     isGrave ? "#7C1D12"   : "#B84020",
        color:           isGrave ? "#4A0E08"    : "#6B1F10",
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: isGrave ? "#7C1D12" : "#B84020" }}
        />
        <div>
          <p className="font-bold text-sm">{MESSAGES[predictedClass]}</p>
          <p className="text-sm mt-1 opacity-90">{recommendation}</p>
        </div>
      </div>
    </div>
  );
}
