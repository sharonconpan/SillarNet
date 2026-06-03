import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ImageUploader from "@/components/analysis/ImageUploader";
import LocationPicker from "@/components/analysis/LocationPicker";
import ProbabilityChart from "@/components/analysis/ProbabilityChart";
import { analysisApi, type Analysis } from "@/api/analysis";
import { CLASS_COLORS, CLASS_ICONS, CLASS_LABELS } from "@/lib/constants";
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface LocationData { lat: number; lng: number; }

type AssessmentLevel = "grave" | "leve" | "trace" | "none";

interface DimResult { level: AssessmentLevel; leveProb: number; graveProb: number; }

function getProbs(result: Analysis): Record<string, number> {
  return Object.fromEntries(result.top5.map((t) => [t.clase, t.probabilidad]));
}

function assessDimension(
  predicted: string,
  leveKey: string,
  graveKey: string,
  probs: Record<string, number>
): DimResult {
  const lp = probs[leveKey]  ?? 0;
  const gp = probs[graveKey] ?? 0;

  let level: AssessmentLevel;
  if (predicted === graveKey)          level = "grave";
  else if (predicted === leveKey)      level = "leve";
  else if (gp >= 15 || lp >= 15)      level = gp >= lp ? "grave" : "leve";
  else if (Math.max(lp, gp) >= 5)     level = "trace";
  else                                 level = "none";

  return { level, leveProb: lp, graveProb: gp };
}


const LEVEL_CFG: Record<AssessmentLevel, { bg: string; border: string; text: string; badge: string }> = {
  grave: { bg: "#7C1D1212", border: "#7C1D12", text: "#7C1D12", badge: "#7C1D12" },
  leve:  { bg: "#B8402012", border: "#B84020", text: "#B84020", badge: "#B84020" },
  trace: { bg: "#C9973A12", border: "#C9973A", text: "#B8860B", badge: "#C9973A" },
  none:  { bg: "#5E8A5C12", border: "#5E8A5C", text: "#3D6B40", badge: "#5E8A5C" },
};

const LEVEL_LABEL: Record<AssessmentLevel, string> = {
  grave: "Grave",
  leve:  "Leve",
  trace: "Indicios",
  none:  "Sin detectar",
};

const LEVEL_ICON: Record<AssessmentLevel, React.ReactNode> = {
  grave: <XCircle    className="w-4 h-4 flex-shrink-0" />,
  leve:  <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
  trace: <AlertTriangle className="w-4 h-4 flex-shrink-0 opacity-75" />,
  none:  <CheckCircle2  className="w-4 h-4 flex-shrink-0" />,
};

interface AssessmentCardProps {
  title: string;
  dim: DimResult;
  leveLabel: string;
  graveLabel: string;
}

function AssessmentCard({ title, dim, leveLabel, graveLabel }: Readonly<AssessmentCardProps>) {
  const cfg = LEVEL_CFG[dim.level];
  const maxProb = Math.max(dim.leveProb, dim.graveProb);

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 border"
      style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.text }}>
        {title}
      </p>

      <div className="flex items-center gap-1.5" style={{ color: cfg.text }}>
        {LEVEL_ICON[dim.level]}
        <span className="text-sm font-bold">{LEVEL_LABEL[dim.level]}</span>
      </div>

      {maxProb >= 1 && (
        <div className="space-y-1.5">
          {[
            { label: leveLabel,  prob: dim.leveProb  },
            { label: graveLabel, prob: dim.graveProb },
          ].map(({ label, prob }) => (
            <div key={label}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] font-medium" style={{ color: cfg.text, opacity: 0.75 }}>
                  {label}
                </span>
                <span className="text-[10px] font-bold" style={{ color: cfg.text }}>
                  {prob.toFixed(1)}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-black/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(prob, 100)}%`, backgroundColor: cfg.badge }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildConfirmContent(isNewFile: boolean) {
  if (isNewFile) {
    return {
      title:  "¿Seleccionar otra imagen?",
      detail: "El análisis actual se cerrará. Guárdalo antes si lo necesitas.",
      label:  "Continuar",
    };
  }
  return {
    title:  "¿Cerrar sin guardar?",
    detail: "El resultado se cerrará y no quedará en tu historial activo.",
    label:  "Sí, cerrar",
  };
}

interface ResultActionsProps {
  pendingAction: "reset" | File | null;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onRequestClose: () => void;
  onSave: () => void;
}

function ResultActions({ pendingAction, saving, onConfirm, onCancel, onRequestClose, onSave }: Readonly<ResultActionsProps>) {
  if (pendingAction) {
    const { title, detail, label } = buildConfirmContent(pendingAction instanceof File);
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
        <p className="text-sm font-semibold text-red-700">{title}</p>
        <p className="text-xs text-red-500">{detail}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="h-10 border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="h-10 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
          >
            {saving ? "…" : label}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRequestClose}
          disabled={saving}
          className="h-12 border border-stone-200 bg-white text-stone-600 rounded-xl text-sm font-semibold hover:border-stone-300 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          Otra foto
        </button>
        <button
          onClick={onRequestClose}
          disabled={saving}
          className="h-12 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          No guardar
        </button>
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full h-12 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-all active:scale-[0.98]"
      >
        {saving ? "Guardando…" : "Guardar en historial"}
      </button>
    </div>
  );
}

export default function AnalyzePage() {
  const [file, setFile]                   = useState<File | null>(null);
  const [preview, setPreview]             = useState<string | null>(null);
  const [location, setLocation]           = useState<LocationData | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [result, setResult]               = useState<Analysis | null>(null);
  const [saving, setSaving]             = useState(false);
  const [pendingAction, setPendingAction] = useState<"reset" | File | null>(null);

  const qc = useQueryClient();
  const navigate = useNavigate();

  function applyFile(f: File) {
    setFile(f);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function handleFile(f: File) {
    if (result) { setPendingAction(f); return; }
    applyFile(f);
  }

  async function handleAnalyze() {
    if (!file || !location) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await analysisApi.analyze(file, location.lat, location.lng, locationLabel || undefined);
      setResult(data);
      qc.invalidateQueries({ queryKey: ["map"] });
    } catch {
      setError("Error al analizar la imagen. Verifica que el servidor esté activo.");
    } finally {
      setLoading(false);
    }
  }

  async function executeClose(then?: File) {
    if (result) {
      setSaving(true);
      await analysisApi.updateStatus(result.id, "closed").catch(() => {});
      setSaving(false);
      qc.invalidateQueries({ queryKey: ["analyses"] });
    }
    if (then) {
      applyFile(then);
    } else {
      setResult(null);
      setFile(null);
      setPreview(null);
    }
    setPendingAction(null);
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    await analysisApi.updateStatus(result.id, "pending").catch(() => {});
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["analyses"] });
    navigate("/history");
  }

  const probs    = result ? getProbs(result) : {};
  const dirtDim  = result ? assessDimension(result.predicted_class, "suciedad_leve",  "suciedad_grave",  probs) : null;
  const detDim   = result ? assessDimension(result.predicted_class, "deterioro_leve", "deterioro_grave", probs) : null;
  const isGood   = result?.predicted_class === "buen_estado";
  const canAnalyze = !!file && !!location && !loading;

  const isNewFile = pendingAction instanceof File;
  const onConfirm = () => executeClose(isNewFile ? (pendingAction as File) : undefined);

  return (
    <div className="min-h-screen bg-stone-50 pb-28 md:pb-12">

      <div className="px-4 pt-6 pb-2 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Analizar</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Sube una foto del muro de sillar para clasificar su estado
        </p>
      </div>

      <div className="px-4 max-w-2xl mx-auto space-y-4">

        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <ImageUploader onFile={handleFile} preview={preview} disabled={loading} />

          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                Ubicación <span className="text-brand-600">*</span>
              </p>
              <LocationPicker
                onLocation={setLocation}
                onLabel={setLocationLabel}
                location={location}
                label={locationLabel}
              />
              {!location && file && (
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  La ubicación es obligatoria para continuar.
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="w-full h-12 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analizando con SillarNet…</>
              ) : "Analizar imagen"}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">

            <div
              className="px-5 py-5 text-white"
              style={{ background: CLASS_COLORS[result.predicted_class] ?? result.color }}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0 mt-0.5">
                  {CLASS_ICONS[result.predicted_class] ?? "❓"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-75">
                    Clasificación principal
                  </p>
                  <p className="text-xl font-bold leading-tight mt-0.5">
                    {CLASS_LABELS[result.predicted_class] ?? result.predicted_class}
                  </p>
                  <p className="text-sm opacity-80 mt-0.5">{result.urgency}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs opacity-70 mb-1.5">
                  <span>Confianza del modelo</span>
                  <span className="font-semibold">{result.confidence.toFixed(1)}%</span>
                </div>
                <div className="bg-white/30 rounded-full h-1.5">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-700"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {isGood ? (
                <div
                  className="rounded-2xl p-4 flex items-center gap-3 border"
                  style={{ backgroundColor: "#5E8A5C15", borderColor: "#5E8A5C" }}
                >
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: "#5E8A5C" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#2D5230" }}>
                      Sin patologías detectadas
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#4A7A50" }}>
                      {result.recommendation}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                      Evaluación por dimensión
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {dirtDim && (
                        <AssessmentCard
                          title="Suciedad"
                          dim={dirtDim}
                          leveLabel="Suciedad leve"
                          graveLabel="Suciedad grave"
                        />
                      )}
                      {detDim && (
                        <AssessmentCard
                          title="Deterioro"
                          dim={detDim}
                          leveLabel="Deterioro leve"
                          graveLabel="Deterioro grave"
                        />
                      )}
                    </div>
                  </div>

                  <div className="bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-600">
                    <span className="font-semibold text-stone-700">Recomendación: </span>
                    {result.recommendation}
                  </div>
                </>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">
                  Probabilidades por clase
                </p>
                <ProbabilityChart top5={result.top5} />
              </div>

              <ResultActions
                pendingAction={pendingAction}
                saving={saving}
                onConfirm={onConfirm}
                onCancel={() => setPendingAction(null)}
                onRequestClose={() => setPendingAction("reset")}
                onSave={handleSave}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
