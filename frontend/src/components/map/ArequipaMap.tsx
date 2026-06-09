import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { AREQUIPA_CENTER, AREQUIPA_ZOOM, CLASS_LABELS, HEATMAP_GRADIENT } from "@/lib/constants";
import type { HeatPoint, MapMarker } from "@/api/map";
import { formatDate } from "@/lib/utils";
import ClosestLocationsSidebar from "./ClosestLocationsSidebar";

function HeatmapLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap();
  const heatRef = useRef<ReturnType<typeof L.heatLayer> | null>(null);

  useEffect(() => {
    if (!points.length) {
      heatRef.current?.remove();
      heatRef.current = null;
      return;
    }

    const latlngs = points.map((p) => [p.lat, p.lng, p.weight] as [number, number, number]);

    if (heatRef.current) {
      heatRef.current.setLatLngs(latlngs);
    } else {
      heatRef.current = L.heatLayer(latlngs, {
        radius: 28,
        blur: 20,
        maxZoom: 17,
        gradient: HEATMAP_GRADIENT,
      }).addTo(map);
    }

    return () => {
      heatRef.current?.remove();
      heatRef.current = null;
    };
  }, [map, points]);

  return null;
}

function MapCenterTracker({
  onCenterChange,
}: {
  onCenterChange: (c: { lat: number; lng: number }) => void;
}) {
  const cbRef = useRef(onCenterChange);
  useEffect(() => { cbRef.current = onCenterChange; }, [onCenterChange]);

  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      cbRef.current({ lat: c.lat, lng: c.lng });
    },
  });
  return null;
}

interface Props {
  heatPoints: HeatPoint[];
  markers: MapMarker[];
}

export default function ArequipaMap({ heatPoints, markers }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: AREQUIPA_CENTER[0],
    lng: AREQUIPA_CENTER[1],
  });

  const handleCenterChange = useCallback(
    (c: { lat: number; lng: number }) => setMapCenter(c),
    [],
  );

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={AREQUIPA_CENTER}
        zoom={AREQUIPA_ZOOM}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />
        <HeatmapLayer points={heatPoints} />
        <MapCenterTracker onCenterChange={handleCenterChange} />
        {markers.map((m, i) => (
          <CircleMarker
            key={i}
            center={[m.lat, m.lng]}
            radius={9}
            pathOptions={{
              fillColor: m.color,
              color: "#fff",
              weight: 2.5,
              fillOpacity: 0.92,
            }}
          >
            <Popup className="sillarnet-popup">
              <div style={{ minWidth: 160 }}>
                {m.stored_image_url && (
                  <img
                    src={m.stored_image_url}
                    alt={CLASS_LABELS[m.predicted_class] ?? m.predicted_class}
                    style={{
                      width: "100%",
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 6,
                      marginBottom: 6,
                      display: "block",
                    }}
                  />
                )}
                <div>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: m.color,
                      display: "inline-block",
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: 13, verticalAlign: "middle" }}>
                    {CLASS_LABELS[m.predicted_class] ?? m.predicted_class}
                  </span>
                </div>
                {m.predicted_class.startsWith("deterioro") && m.suciedad_clase && m.suciedad_clase !== "ninguno" && (
                  <p style={{ fontSize: 11, color: "#C07030", margin: "3px 0 0" }}>
                    + {CLASS_LABELS[`suciedad_${m.suciedad_clase}`] ?? `Suciedad ${m.suciedad_clase}`}
                  </p>
                )}
                {m.location_label && (
                  <p style={{ fontSize: 11, color: "#78716c", marginTop: 4, marginBottom: 0 }}>
                    {m.location_label}
                  </p>
                )}
                <p style={{ fontSize: 11, color: "#a8a29e", marginTop: 2, marginBottom: 0 }}>
                  {formatDate(m.created_at)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Sidebar toggle button — left edge, vertically centered */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-[1001]
                     w-5 h-12 flex items-center justify-center
                     bg-white/88 backdrop-blur-xl rounded-r-lg
                     shadow-[1px_0_8px_rgba(0,0,0,0.10)]
                     border border-l-0 border-white/60
                     text-stone-400 text-[11px]
                     active:scale-95 transition-transform"
          aria-label="Ver ubicaciones cercanas"
        >
          ›
        </button>
      )}

      {sidebarOpen && (
        <ClosestLocationsSidebar
          markers={markers}
          mapCenter={mapCenter}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
