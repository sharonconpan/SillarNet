import { useEffect, useMemo, useState } from "react";
import type { MapMarker } from "@/api/map";
import { CLASS_LABELS } from "@/lib/constants";
import { haversineMeters } from "@/lib/utils";

interface Props {
  markers: MapMarker[];
  mapCenter: { lat: number; lng: number };
  onClose: () => void;
}

function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export default function ClosestLocationsSidebar({ markers, mapCenter, onClose }: Props) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError(true),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  const origin = userPos ?? mapCenter;

  const sorted = useMemo(
    () =>
      [...markers]
        .map((m) => ({ ...m, distM: haversineMeters(origin.lat, origin.lng, m.lat, m.lng) }))
        .sort((a, b) => a.distM - b.distM)
        .slice(0, 20),
    [markers, origin.lat, origin.lng],
  );

  return (
    <div
      className="absolute left-0 top-1/2 -translate-y-1/2 z-[1001] w-52 max-w-[62vw]
                 bg-white/95 backdrop-blur-2xl rounded-r-2xl
                 shadow-[4px_0_20px_rgba(0,0,0,0.12)]
                 border border-l-0 border-white/60
                 flex flex-col overflow-hidden max-h-[46vh]"
      style={{ pointerEvents: "auto" }}
    >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-stone-100 flex items-start justify-between flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              {userPos ? "Más cercanos a ti" : "Más cercanos"}
            </p>
            {geoError && !userPos && (
              <p className="text-[10px] text-stone-400 mt-0.5">
                GPS no disponible · usando centro del mapa
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors flex-shrink-0 ml-2"
            aria-label="Cerrar panel"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {sorted.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-10 px-4">
              Sin registros con el filtro activo
            </p>
          ) : (
            <ul className="divide-y divide-stone-50">
              {sorted.map((m, i) => (
                <li key={i} className="px-4 py-3 flex items-start gap-3 active:bg-stone-50">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-[3px]"
                    style={{ backgroundColor: m.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-stone-700 leading-snug break-words">
                      {m.location_label ?? `${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}`}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {CLASS_LABELS[m.predicted_class] ?? m.predicted_class}
                      {" · "}
                      {formatDistance(m.distM)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
    </div>
  );
}
