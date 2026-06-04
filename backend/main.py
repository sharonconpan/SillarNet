import os
import numpy as np
from pathlib import Path
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import tensorflow as tf
from PIL import Image
import io

app = FastAPI(title="SillarNet Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

import sys
if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys.executable).parent
else:
    BASE_DIR = Path(__file__).parent.parent

# ─── Modelos ──────────────────────────────────────────────────────────────────
MODEL_DETERIORO_PATH  = BASE_DIR / "outputs_modelo"          / "sillarnet_final.keras"
MODEL_SUCIEDAD_PATH   = BASE_DIR / "outputs_modelo_suciedad" / "sillarnet_suciedad_final.keras"

print(f"Cargando modelo deterioro : {MODEL_DETERIORO_PATH}")
modelo_deterioro = tf.keras.models.load_model(str(MODEL_DETERIORO_PATH))

print(f"Cargando modelo suciedad  : {MODEL_SUCIEDAD_PATH}")
modelo_suciedad  = tf.keras.models.load_model(str(MODEL_SUCIEDAD_PATH))

CLASS_NAMES = ['ninguno', 'leve', 'grave']   # mismo orden en ambos modelos
print(f"✅ Ambos modelos cargados. Clases: {CLASS_NAMES}")

# ─── Pesos para índice 0–100 ──────────────────────────────────────────────────
PESOS = {'ninguno': 0, 'leve': 50, 'grave': 100}

def calcular_indice(probs: dict) -> float:
    return round(
        PESOS['ninguno'] * probs['ninguno'] +
        PESOS['leve']    * probs['leve']    +
        PESOS['grave']   * probs['grave'],
        2
    )

# ─── Preprocesamiento ─────────────────────────────────────────────────────────
def preprocesar(imagen_bytes: bytes):
    img = Image.open(io.BytesIO(imagen_bytes)).convert('RGB')
    img = img.resize((224, 224))
    arr = np.array(img, dtype=np.float32)   # sin /255 — EfficientNetB0 lo hace internamente
    return np.expand_dims(arr, axis=0)

# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/")
def raiz():
    html_path = Path(__file__).parent.parent / "frontend" / "index.html"
    return FileResponse(str(html_path))

@app.post("/analizar")
async def analizar(file: UploadFile = File(...)):
    contenido  = await file.read()
    img_tensor = preprocesar(contenido)

    # — Deterioro —
    pred_det  = modelo_deterioro.predict(img_tensor, verbose=0)[0]
    probs_det = {CLASS_NAMES[i]: float(pred_det[i]) for i in range(3)}
    clase_det = CLASS_NAMES[int(np.argmax(pred_det))]
    idx_det   = calcular_indice(probs_det)

    # — Suciedad —
    pred_suc  = modelo_suciedad.predict(img_tensor, verbose=0)[0]
    probs_suc = {CLASS_NAMES[i]: float(pred_suc[i]) for i in range(3)}
    clase_suc = CLASS_NAMES[int(np.argmax(pred_suc))]
    idx_suc   = calcular_indice(probs_suc)

    return {
        "deterioro": {
            "clase"           : clase_det,
            "indice"          : idx_det,
            "ninguno"         : round(probs_det['ninguno'] * 100, 1),
            "leve"            : round(probs_det['leve']    * 100, 1),
            "grave"           : round(probs_det['grave']   * 100, 1),
        },
        "suciedad": {
            "clase"           : clase_suc,
            "indice"          : idx_suc,
            "ninguno"         : round(probs_suc['ninguno'] * 100, 1),
            "leve"            : round(probs_suc['leve']    * 100, 1),
            "grave"           : round(probs_suc['grave']   * 100, 1),
        }
    }

app.mount("/frontend", StaticFiles(directory=str(BASE_DIR / "frontend")), name="frontend")