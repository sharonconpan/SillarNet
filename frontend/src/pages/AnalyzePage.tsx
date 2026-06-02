import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ImageUploader from "@/components/analysis/ImageUploader";
import LocationPicker from "@/components/analysis/LocationPicker";
import ResultCard from "@/components/analysis/ResultCard";
import DeteriorationAlert from "@/components/analysis/DeteriorationAlert";
import ProbabilityChart from "@/components/analysis/ProbabilityChart";
import { analysisApi, type Analysis } from "@/api/analysis";
import { Loader2 } from "lucide-react";

interface LocationData { lat: number; lng: number; }

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [saving, setSaving] = useState(false);

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
      const data = await analysisApi.analyze(
        file,
        location?.lat,
        location?.lng,
        locationLabel || undefined
      );
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analizar imagen</h1>
        <p className="text-sm text-gray-500 mt-1">Sube una foto del muro de sillar para clasificar su estado</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <ImageUploader onFile={handleFile} preview={preview} disabled={loading} />

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Ubicación (opcional)</p>
          <LocationPicker
            onLocation={setLocation}
            onLabel={setLocationLabel}
            location={location}
            label={locationLabel}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="w-full bg-brand-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analizando con SillarNet...
            </>
          ) : (
            "Analizar imagen"
          )}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <ResultCard analysis={result} />
          <DeteriorationAlert
            predictedClass={result.predicted_class}
            recommendation={result.recommendation}
          />

          {!result.is_deterioration && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
              💡 {result.recommendation}
            </div>
          )}

          <ProbabilityChart top5={result.top5} />

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              Guardar en historial
            </button>
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:border-red-400 hover:text-red-600 disabled:opacity-60 transition-colors"
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
