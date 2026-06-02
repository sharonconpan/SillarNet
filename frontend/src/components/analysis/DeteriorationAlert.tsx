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
      className={`rounded-xl border-2 p-4 ${
        isGrave
          ? "bg-purple-50 border-purple-400 text-purple-900"
          : "bg-red-50 border-red-400 text-red-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isGrave ? "text-purple-600" : "text-red-600"}`} />
        <div>
          <p className="font-bold text-sm">{MESSAGES[predictedClass]}</p>
          <p className="text-sm mt-1 opacity-90">{recommendation}</p>
        </div>
      </div>
    </div>
  );
}
