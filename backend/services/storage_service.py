import io
from pathlib import Path

from PIL import Image

from config import settings

MAX_DIMENSION = 1024


def _get_uploads_root() -> Path:
    path = Path(settings.uploads_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_image(image_bytes: bytes, user_id: str, analysis_id: str) -> str:
    """Save image to disk, resize to max 1024px, return relative path."""
    root = _get_uploads_root()
    user_dir = root / user_id
    user_dir.mkdir(exist_ok=True)

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Resize to max dimension while preserving aspect ratio
    w, h = img.size
    if max(w, h) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

    relative_path = f"{user_id}/{analysis_id}.jpg"
    img.save(root / relative_path, "JPEG", quality=85)
    return relative_path


def delete_image(stored_path: str) -> None:
    full_path = Path(settings.uploads_dir) / stored_path
    if full_path.exists():
        full_path.unlink()
