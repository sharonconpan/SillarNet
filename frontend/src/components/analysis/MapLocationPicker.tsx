import { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { AREQUIPA_CENTER } from "@/lib/constants";

interface LocPoint { lat: number; lng: number; }

interface Props {
  value: LocPoint | null;
  onChange: (loc: LocPoint) => void;
}

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:22px;height:22px;
    background:#8C4A1E;
    border-radius:50%;
    border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
    cursor:pointer;
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapController({ value }: { value: LocPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) {
      map.flyTo([value.lat, value.lng], map.getZoom(), { animate: true, duration: 0.5 });
    }
  }, [map, value?.lat, value?.lng]);
  return null;
}

function ClickHandler({ onChange }: { onChange: (loc: LocPoint) => void }) {
  const callbackRef = useRef(onChange);
  useEffect(() => { callbackRef.current = onChange; }, [onChange]);
  useMapEvents({
    click(e) {
      callbackRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapLocationPicker({ value, onChange }: Readonly<Props>) {
  const [mapKey] = useState(() => Math.random().toString(36).slice(2));

  return (
    <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm" style={{ height: 220 }}>
      <MapContainer
        key={mapKey}
        center={AREQUIPA_CENTER}
        zoom={16}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapController value={value} />
        <ClickHandler onChange={onChange} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend(e) {
                const pos = (e.target as L.Marker).getLatLng();
                onChange({ lat: pos.lat, lng: pos.lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
