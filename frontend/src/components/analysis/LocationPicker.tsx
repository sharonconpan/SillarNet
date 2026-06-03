import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Map, X } from "lucide-react";

const MapLocationPicker = lazy(() => import("./MapLocationPicker"));

interface LocationData { lat: number; lng: number; }

interface Props {
  onLocation: (loc: LocationData | null) => void;
  onLabel: (label: string) => void;
  location: LocationData | null;
  label: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`,
    { headers: { "Accept-Language": "es" } }
  );
  if (!res.ok) throw new Error("geocode failed");
  const data = await res.json();
  const a = data.address ?? {};

  const raw = [
    a.road,
    a.house_number,
    a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district,
    a.city ?? a.town ?? a.village,
    a.county ?? a.state_district,
    a.state,
    a.country,
  ].filter(Boolean) as string[];

  const parts = raw.filter((v, i) => v !== raw[i - 1]);
  return parts.join(", ");
}

export default function LocationPicker({ onLocation, onLabel, location, label }: Props) {
  const [gpsLoading, setGpsLoading]     = useState(false);
  const [gpsError, setGpsError]         = useState("");
  const [showMap, setShowMap]           = useState(false);
  const [geocoding, setGeocoding]       = useState(false);
  const prevCoords                       = useRef<string | null>(null);

  useEffect(() => {
    if (!location) return;
    const key = `${location.lat},${location.lng}`;
    if (key === prevCoords.current) return;
    prevCoords.current = key;

    setGeocoding(true);
    reverseGeocode(location.lat, location.lng)
      .then((address) => { if (address) onLabel(address); })
      .catch(() => {})
      .finally(() => setGeocoding(false));
  }, [location?.lat, location?.lng]);

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
        setShowMap(false);
      },
      () => {
        setGpsError("No se pudo obtener la ubicación. Verifica los permisos.");
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function clearLocation() {
    onLocation(null);
    onLabel("");
    prevCoords.current = null;
    setShowMap(false);
    setGpsError("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={getGps}
          disabled={gpsLoading}
          className="flex items-center gap-2 text-sm border border-stone-300 rounded-lg px-3 py-2 hover:border-brand-500 hover:text-brand-600 transition-colors disabled:opacity-60 bg-white"
        >
          {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          {location && !showMap ? "GPS obtenido" : "Usar GPS"}
        </button>

        <button
          type="button"
          onClick={() => setShowMap((s) => !s)}
          className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 transition-colors bg-white ${
            showMap
              ? "border-brand-500 text-brand-600"
              : "border-stone-300 hover:border-brand-500 hover:text-brand-600"
          }`}
        >
          <Map className="w-4 h-4" />
          {showMap ? "Cerrar mapa" : "Seleccionar en mapa"}
        </button>

        {location && (
          <button
            type="button"
            onClick={clearLocation}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
            Quitar
          </button>
        )}
      </div>

      {gpsError && <p className="text-xs text-red-500">{gpsError}</p>}

      {showMap && (
        <div className="space-y-1.5">
          <p className="text-xs text-stone-500 font-medium">
            Toca el mapa para colocar el marcador, o arrástralo para ajustar
          </p>
          <Suspense
            fallback={
              <div className="h-[220px] rounded-xl bg-stone-100 flex items-center justify-center text-sm text-stone-400">
                Cargando mapa…
              </div>
            }
          >
            <MapLocationPicker value={location} onChange={onLocation} />
          </Suspense>
        </div>
      )}

      {location && (
        <p className="text-xs text-stone-400 font-mono">
          {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </p>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder="Dirección del lugar"
          value={label}
          onChange={(e) => onLabel(e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white pr-8"
        />
        {geocoding && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-stone-400" />
        )}
      </div>
    </div>
  );
}
