import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { AREQUIPA_CENTER, AREQUIPA_ZOOM, CLASS_LABELS } from "@/lib/constants";
import type { HeatPoint, MapMarker } from "@/api/map";
import { formatDate } from "@/lib/utils";

function HeatmapLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap();
  const heatRef = useRef<ReturnType<typeof L.heatLayer> | null>(null);

  useEffect(() => {
    if (!points.length) return;

    const latlngs = points.map((p) => [p.lat, p.lng, p.weight] as [number, number, number]);

    if (heatRef.current) {
      heatRef.current.setLatLngs(latlngs);
    } else {
      heatRef.current = L.heatLayer(latlngs, {
        radius: 28,
        blur: 20,
        maxZoom: 17,
        gradient: { 0.1: "#2ecc71", 0.45: "#f1c40f", 0.75: "#e74c3c", 1.0: "#8e44ad" },
      }).addTo(map);
    }

    return () => {
      heatRef.current?.remove();
      heatRef.current = null;
    };
  }, [map, points]);

  return null;
}

interface Props {
  heatPoints: HeatPoint[];
  markers: MapMarker[];
}

export default function ArequipaMap({ heatPoints, markers }: Props) {
  return (
    <MapContainer
      center={AREQUIPA_CENTER}
      zoom={AREQUIPA_ZOOM}
      className="w-full h-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <HeatmapLayer points={heatPoints} />
      {markers.map((m, i) => (
        <CircleMarker
          key={i}
          center={[m.lat, m.lng]}
          radius={6}
          pathOptions={{ fillColor: m.color, color: "#fff", weight: 1.5, fillOpacity: 0.9 }}
        >
          <Popup>
            <div className="text-xs space-y-0.5">
              <p className="font-semibold">{CLASS_LABELS[m.predicted_class] ?? m.predicted_class}</p>
              {m.location_label && <p className="text-gray-500">{m.location_label}</p>}
              <p className="text-gray-400">{formatDate(m.created_at)}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
