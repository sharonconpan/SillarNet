import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { AREQUIPA_CENTER, AREQUIPA_ZOOM, CLASS_LABELS, HEATMAP_GRADIENT } from "@/lib/constants";
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        maxZoom={20}
      />
      <HeatmapLayer points={heatPoints} />
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
            <div style={{ minWidth: 140 }}>
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
  );
}
