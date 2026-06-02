import uuid
from datetime import datetime

from sqlalchemy import String, Float, Boolean, Text, DateTime, ForeignKey, func, JSON, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from database import Base


class AnalysisStatus(str, enum.Enum):
    pending = "pending"
    discarded = "discarded"
    completed = "completed"


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    stored_path: Mapped[str] = mapped_column(String(500), nullable=False)
    predicted_class: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    top5_json: Mapped[list] = mapped_column(JSON, nullable=False)
    color: Mapped[str] = mapped_column(String(10), nullable=False)
    urgency: Mapped[str] = mapped_column(String(150), nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    is_deterioration: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    location_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[AnalysisStatus] = mapped_column(SAEnum(AnalysisStatus), nullable=False, default=AnalysisStatus.pending)
    re_analyze_suggested: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="analyses")
