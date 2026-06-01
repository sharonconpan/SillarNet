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

# ─── Configuración ────────────────────────────────────────────────────────────
app = FastAPI(title="SillarNet Dashboard")

# Permite que el HTML del frontend llame al backend sin error de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Carga del modelo (se hace UNA sola vez al iniciar el servidor) ───────────

import sys
if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys.executable).parent
else:
    BASE_DIR = Path(__file__).parent.parent


MODEL_PATH  = BASE_DIR / "outputs_modelo" / "sillarnet_final.keras"
CLASES_PATH = BASE_DIR / "outputs_modelo" / "class_names.txt"

print(f"Cargando modelo desde: {MODEL_PATH}")
modelo      = tf.keras.models.load_model(str(MODEL_PATH))
CLASS_NAMES = open(CLASES_PATH).read().splitlines()
print(f"✅ Modelo cargado. Clases: {CLASS_NAMES}")

# ─── Lógica del semáforo ──────────────────────────────────────────────────────
URGENCIA = {
    'buen_estado':     'ninguna',
    'suciedad_leve':   'secundaria — sin deterioro estructural',
    'suciedad_grave':  'secundaria — sin deterioro estructural',
    'deterioro_leve':  'PRIORITARIA — deterioro estructural',
    'deterioro_grave': 'CRÍTICA — deterioro estructural grave'
}

COLORES = {
    'buen_estado':     '#2ecc71',
    'suciedad_leve':   '#f1c40f',
    'suciedad_grave':  '#e67e22',
    'deterioro_leve':  '#e74c3c',
    'deterioro_grave': '#8e44ad'
}

RECOMENDACIONES = {
    'buen_estado':
        'Sin intervención requerida. Mantenimiento preventivo anual.',
    'suciedad_leve':
        'Limpieza superficial con agua destilada y cepillo suave. Inspección semestral.',
    'suciedad_grave':
        'Limpieza profunda con métodos físico-químicos no abrasivos. Plazo: 3 meses.',
    'deterioro_leve':
        'Consolidación superficial con mortero compatible. Plazo: 1 mes.',
    'deterioro_grave':
        'INTERVENCIÓN URGENTE. Consolidación estructural. Restricción de acceso recomendada.'
}

# ─── Función de preprocesamiento (igual que en el notebook) ──────────────────
def preprocesar(imagen_bytes: bytes):
    img = Image.open(io.BytesIO(imagen_bytes)).convert('RGB')
    img = img.resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)   # (1, 224, 224, 3)

# ─── Endpoints ────────────────────────────────────────────────────────────────

    
@app.get("/")
def raiz():
    from fastapi.responses import FileResponse
    from pathlib import Path
    html_path = Path(__file__).parent.parent / "frontend" / "index.html"
    return FileResponse(str(html_path))

@app.post("/analizar")
async def analizar(file: UploadFile = File(...)):
    contenido  = await file.read()
    img_tensor = preprocesar(contenido)

    prediccion = modelo.predict(img_tensor, verbose=0)[0]
    idx        = int(np.argmax(prediccion))
    clase      = CLASS_NAMES[idx]
    confianza  = float(prediccion[idx])

    # Top 5 probabilidades
    top5 = [
        {"clase": CLASS_NAMES[i], "probabilidad": round(float(prediccion[i]) * 100, 1)}
        for i in np.argsort(prediccion)[::-1]
    ]

    return {
        "clase"                  : clase,
        "confianza"              : round(confianza * 100, 1),
        "color"                  : COLORES[clase],
        "urgencia"               : URGENCIA[clase],
        "necesita_mantenimiento" : clase != 'buen_estado',
        "recomendacion"          : RECOMENDACIONES[clase],
        "top5"                   : top5
    }

# Sirve archivos estáticos del frontend
app.mount("/frontend", StaticFiles(directory=str(BASE_DIR / "frontend")), name="frontend")