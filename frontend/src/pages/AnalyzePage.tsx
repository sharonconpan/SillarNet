import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ImageUploader from "@/components/analysis/ImageUploader";
import LocationPicker from "@/components/analysis/LocationPicker";
import ResultCard from "@/components/analysis/ResultCard";
import DeteriorationAlert from "@/components/analysis/DeteriorationAlert";
import ProbabilityChart from "@/components/analysis/ProbabilityChart";
import { analysisApi, type Analysis } from "@/api/analysis";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface LocationData { lat: number; lng: number; }

export default function AnalyzePage() {
  const [file, setFile]                   = useState<File | null>(null);
  const [preview, setPreview]             = useState<string | null>(null);
  const [location, setLocation]           = useState<LocationData | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [showLocation, setShowLocation]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [result, setResult]               = useState<Analysis | null>(null);
  const [saving, setSaving]               = useState(false);

  const qc = useQueryClient();
  const navigate = useNavigate();

  function handleFile(f: File) {
    setFile(f);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await analysisApi.analyze(file, location?.lat, location?.lng, locationLabel || undefined);
      setResult(data);
      qc.invalidateQueries({ queryKey: ["map"] });
    } catch {
      setError("Error al analizar la imagen. Verifica que el servidor esté activo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDiscard() {
    if (!result) return;
    setSaving(true);
    await analysisApi.updateStatus(result.id, "discarded").catch(() => {});
    setSaving(false);
    setResult(null);
    setFile(null);
    setPreview(null);
    qc.invalidateQueries({ queryKey: ["analyses"] });
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    await analysisApi.updateStatus(result.id, "pending").catch(() => {});
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["analyses"] });
    navigate("/history");
  }

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
            <button
              type="button"
              onClick={() => setShowLocation((s) => !s)}
              className="w-full flex items-center justify-between text-sm text-stone-500 py-1 hover:text-stone-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${location ? "bg-emerald-500" : "bg-stone-300"}`} />
                {location ? "Ubicación añadida" : "Añadir ubicación (opcional)"}
              </span>
              {showLocation
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />}
            </button>

            {showLocation && (
              <div className="pt-1 border-t border-stone-100">
                <LocationPicker
                  onLocation={setLocation}
                  onLabel={setLocationLabel}
                  location={location}
                  label={locationLabel}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="w-full h-12 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizando con SillarNet…
                </>
              ) : (
                "Analizar imagen"
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 space-y-5">
            <ResultCard analysis={result} />

            <DeteriorationAlert
              predictedClass={result.predicted_class}
              recommendation={result.recommendation}
            />

            {!result.is_deterioration && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ backgroundColor: "#5E8A5C18", color: "#2D5230" }}
              >
                💡 {result.recommendation}
              </div>
            )}

            <ProbabilityChart top5={result.top5} />

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-12 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                Guardar
              </button>
              <button
                onClick={handleDiscard}
                disabled={saving}
                className="h-12 border border-stone-200 text-stone-600 rounded-xl text-sm font-semibold hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
