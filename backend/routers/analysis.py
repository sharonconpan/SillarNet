import uuid
import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from dependencies import get_current_user
from models.user import User
from models.analysis import Analysis, AnalysisStatus
from schemas.analysis import AnalysisOut, AnalysisSummary, PaginatedAnalyses, AnalysisStatusUpdate, AnalysisNotesUpdate
from services.ml_service import get_model
from services.storage_service import save_image

router = APIRouter(prefix="/analyses", tags=["analyses"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _analysis_to_out(a: Analysis, base_url: str = "") -> AnalysisOut:
    return AnalysisOut(
        id=str(a.id),
        predicted_class=a.predicted_class,
        confidence=a.confidence,
        color=a.color,
        urgency=a.urgency,
        recommendation=a.recommendation,
        is_deterioration=a.is_deterioration,
        top5=a.top5_json,
        stored_image_url=f"/uploads/{a.stored_path}",
        latitude=a.latitude,
        longitude=a.longitude,
        location_label=a.location_label,
        status=a.status.value,
        re_analyze_suggested=a.re_analyze_suggested,
        notes=a.notes,
        created_at=a.created_at,
    )


def _analysis_to_summary(a: Analysis) -> AnalysisSummary:
    return AnalysisSummary(
        id=str(a.id),
        predicted_class=a.predicted_class,
        confidence=a.confidence,
        color=a.color,
        urgency=a.urgency,
        is_deterioration=a.is_deterioration,
        stored_image_url=f"/uploads/{a.stored_path}",
        latitude=a.latitude,
        longitude=a.longitude,
        location_label=a.location_label,
        status=a.status.value,
        re_analyze_suggested=a.re_analyze_suggested,
        created_at=a.created_at,
    )


@router.post("/analizar", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
async def analizar(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(default=None),
    longitude: Optional[float] = Form(default=None),
    location_label: Optional[str] = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type. Use JPEG, PNG or WebP.")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=413, detail="Image too large. Max 10 MB.")

    result = await get_model().predict(image_bytes)

    analysis_id = str(uuid.uuid4())
    stored_path = save_image(image_bytes, str(current_user.id), analysis_id)

    analysis = Analysis(
        id=uuid.UUID(analysis_id),
        user_id=current_user.id,
        stored_path=stored_path,
        predicted_class=result["predicted_class"],
        confidence=result["confidence"],
        top5_json=result["top5"],
        color=result["color"],
        urgency=result["urgency"],
        recommendation=result["recommendation"],
        is_deterioration=result["is_deterioration"],
        latitude=latitude,
        longitude=longitude,
        location_label=location_label,
        status=AnalysisStatus.pending,
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)

    return _analysis_to_out(analysis)


@router.get("/", response_model=PaginatedAnalyses)
async def list_analyses(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 12,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if page < 1:
        page = 1
    if limit < 1 or limit > 50:
        limit = 12

    q = select(Analysis).where(Analysis.user_id == current_user.id)
    count_q = select(func.count()).select_from(Analysis).where(Analysis.user_id == current_user.id)

    if status and status in ("pending", "discarded", "completed"):
        status_enum = AnalysisStatus(status)
        q = q.where(Analysis.status == status_enum)
        count_q = count_q.where(Analysis.status == status_enum)

    total_result = await db.execute(count_q)
    total = total_result.scalar()

    q = q.order_by(Analysis.created_at.desc()).offset((page - 1) * limit).limit(limit)
    rows = await db.execute(q)
    items = rows.scalars().all()

    return PaginatedAnalyses(
        items=[_analysis_to_summary(a) for a in items],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 0,
    )


@router.get("/{analysis_id}", response_model=AnalysisOut)
async def get_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Analysis).where(
            Analysis.id == uuid.UUID(analysis_id),
            Analysis.user_id == current_user.id,
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return _analysis_to_out(analysis)


@router.patch("/{analysis_id}/status", response_model=AnalysisOut)
async def update_status(
    analysis_id: str,
    body: AnalysisStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.status not in ("pending", "discarded", "completed"):
        raise HTTPException(status_code=422, detail="Invalid status value")

    result = await db.execute(
        select(Analysis).where(
            Analysis.id == uuid.UUID(analysis_id),
            Analysis.user_id == current_user.id,
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis.status = AnalysisStatus(body.status)
    if body.status == "completed":
        analysis.re_analyze_suggested = True

    await db.commit()
    await db.refresh(analysis)
    return _analysis_to_out(analysis)


@router.patch("/{analysis_id}/notes", response_model=AnalysisOut)
async def update_notes(
    analysis_id: str,
    body: AnalysisNotesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Analysis).where(
            Analysis.id == uuid.UUID(analysis_id),
            Analysis.user_id == current_user.id,
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis.notes = body.notes
    await db.commit()
    await db.refresh(analysis)
    return _analysis_to_out(analysis)
