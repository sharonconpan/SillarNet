import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ImageUploader from "@/components/analysis/ImageUploader";
import LocationPicker from "@/components/analysis/LocationPicker";
import { analysisApi, type Analysis } from "@/api/analysis";
import { Loader2 } from "lucide-react";
import ResultCard from "@/components/analysis/ResultCard";

interface LocationData { lat: number; lng: number; }

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
      await analysisApi.delete(result.id).catch(() => {});
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
          <>
            <ResultCard analysis={result} />
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 space-y-4">
              <div className="bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-600">
                <span className="font-semibold text-stone-700">Recomendación: </span>
                {result.recommendation}
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
          </>
        )}
      </div>
    </div>
  );
}
