from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel


class AnalysisOut(BaseModel):
    id: str
    predicted_class: str
    confidence: float
    color: str
    urgency: str
    recommendation: str
    is_deterioration: bool
    deterioro_clase: str | None
    deterioro_indice: float | None
    suciedad_clase: str | None
    suciedad_indice: float | None
    probs: dict
    stored_image_url: str
    latitude: float | None
    longitude: float | None
    location_label: str | None
    status: str
    re_analyze_suggested: bool
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisStatusUpdate(BaseModel):
    status: str


class AnalysisNotesUpdate(BaseModel):
    notes: str


class AnalysisSummary(BaseModel):
    id: str
    predicted_class: str
    confidence: float
    color: str
    urgency: str
    is_deterioration: bool
    deterioro_clase: str | None
    deterioro_indice: float | None
    suciedad_clase: str | None
    suciedad_indice: float | None
    stored_image_url: str
    latitude: float | None
    longitude: float | None
    location_label: str | None
    status: str
    re_analyze_suggested: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedAnalyses(BaseModel):
    items: list[AnalysisSummary]
    total: int
    page: int
    limit: int
    pages: int
