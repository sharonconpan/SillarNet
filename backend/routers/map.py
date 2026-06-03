import time
from typing import Any

from fastapi import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends

from database import get_db
from models.analysis import Analysis, AnalysisStatus
from schemas.map import HeatmapResponse, HeatPoint, MarkersResponse, MapMarker
from services.ml_service import HEATMAP_WEIGHT

router = APIRouter(prefix="/map", tags=["map"])

# Simple in-memory cache: (data, timestamp)
_heatmap_cache: dict[str, Any] = {}
_markers_cache: dict[str, Any] = {}
CACHE_TTL = 300  # 5 minutes


@router.get("/heatmap", response_model=HeatmapResponse)
async def get_heatmap(db: AsyncSession = Depends(get_db)):
    now = time.time()
    if "data" in _heatmap_cache and now - _heatmap_cache["ts"] < CACHE_TTL:
        return _heatmap_cache["data"]

    result = await db.execute(
        select(Analysis).where(
            Analysis.latitude.is_not(None),
            Analysis.status != AnalysisStatus.closed,
        )
    )
    analyses = result.scalars().all()

    points = [
        HeatPoint(
            lat=a.latitude,
            lng=a.longitude,
            weight=HEATMAP_WEIGHT.get(a.predicted_class, 0.5),
        )
        for a in analyses
    ]

    deterioration_count = sum(1 for a in analyses if a.is_deterioration)
    critical_count = sum(1 for a in analyses if a.predicted_class == "deterioro_grave")

    response = HeatmapResponse(
        points=points,
        total=len(analyses),
        deterioration_count=deterioration_count,
        critical_count=critical_count,
    )
    _heatmap_cache["data"] = response
    _heatmap_cache["ts"] = now
    return response


@router.get("/markers", response_model=MarkersResponse)
async def get_markers(db: AsyncSession = Depends(get_db)):
    now = time.time()
    if "data" in _markers_cache and now - _markers_cache["ts"] < CACHE_TTL:
        return _markers_cache["data"]

    result = await db.execute(
        select(Analysis).where(
            Analysis.latitude.is_not(None),
            Analysis.status != AnalysisStatus.closed,
        ).order_by(Analysis.created_at.desc())
    )
    analyses = result.scalars().all()

    markers = [
        MapMarker(
            lat=a.latitude,
            lng=a.longitude,
            predicted_class=a.predicted_class,
            color=a.color,
            location_label=a.location_label,
            created_at=a.created_at.isoformat(),
            stored_image_url=f"/uploads/{a.stored_path}",
            status=a.status.value,
        )
        for a in analyses
    ]

    response = MarkersResponse(markers=markers)
    _markers_cache["data"] = response
    _markers_cache["ts"] = now
    return response
