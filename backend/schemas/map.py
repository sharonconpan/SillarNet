from pydantic import BaseModel


class HeatPoint(BaseModel):
    lat: float
    lng: float
    weight: float


class MapMarker(BaseModel):
    lat: float
    lng: float
    predicted_class: str
    color: str
    location_label: str | None
    created_at: str
    stored_image_url: str | None = None
    status: str | None = None


class HeatmapResponse(BaseModel):
    points: list[HeatPoint]
    total: int
    deterioration_count: int
    critical_count: int


class MarkersResponse(BaseModel):
    markers: list[MapMarker]
