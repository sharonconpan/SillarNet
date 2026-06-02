from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel


class Top5Item(BaseModel):
    clase: str
    probabilidad: float


class AnalysisOut(BaseModel):
    id: str
    predicted_class: str
    confidence: float
    color: str
    urgency: str
    recommendation: str
    is_deterioration: bool
    top5: list[Top5Item]
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
    status: str  # pending | discarded | completed


class AnalysisNotesUpdate(BaseModel):
    notes: str


class AnalysisSummary(BaseModel):
    id: str
    predicted_class: str
    confidence: float
    color: str
    urgency: str
    is_deterioration: bool
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
