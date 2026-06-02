// Type shim for leaflet.heat (no official @types package)
import "leaflet";
import type { Map, Layer } from "leaflet";

declare module "leaflet" {
  function heatLayer(
    latlngs: [number, number, number?][],
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: Record<number, string>;
    }
  ): Layer & { setLatLngs(latlngs: [number, number, number?][]): void; addTo(map: Map): Layer };
}
