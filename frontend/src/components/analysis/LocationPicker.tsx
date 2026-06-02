import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface LocationData {
  lat: number;
  lng: number;
}

interface Props {
  onLocation: (loc: LocationData | null) => void;
  onLabel: (label: string) => void;
  location: LocationData | null;
  label: string;
}

export default function LocationPicker({ onLocation, onLabel, location, label }: Props) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  function getGps() {
    if (!navigator.geolocation) {
      setGpsError("Tu navegador no soporta geolocalización.");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGpsError("No se pudo obtener la ubicación. Verifica los permisos.");
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={getGps}
          disabled={gpsLoading}
          className="flex items-center gap-2 text-sm border border-gray-300 rounded-lg px-3 py-2 hover:border-brand-500 hover:text-brand-600 transition-colors disabled:opacity-60"
        >
          {gpsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          {location ? "Ubicación obtenida ✓" : "Usar mi ubicación GPS"}
        </button>
        {location && (
          <button
            type="button"
            onClick={() => onLocation(null)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Quitar
          </button>
        )}
      </div>

      {gpsError && <p className="text-xs text-red-500">{gpsError}</p>}

      {location && (
        <p className="text-xs text-gray-500">
          {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </p>
      )}

      <input
        type="text"
        placeholder="Nombre del lugar (opcional) — ej: Calle San Francisco 123"
        value={label}
        onChange={(e) => onLabel(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
