from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from services.ml_service import get_model
from routers import auth, analysis, map as map_router


Path(settings.uploads_dir).mkdir(parents=True, exist_ok=True)


_PROJECT_ROOT = Path(__file__).parent.parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_model().load(
        model_path=_PROJECT_ROOT / settings.model_path,
        classes_path=_PROJECT_ROOT / settings.classes_path,
    )
    yield


app = FastAPI(title="SillarNet API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploaded images
app.mount("/uploads", StaticFiles(directory=settings.uploads_dir), name="uploads")

# API routers
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(analysis.router, prefix=API_PREFIX)
app.include_router(map_router.router, prefix=API_PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok"}
