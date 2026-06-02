import asyncio
import io
from pathlib import Path

import numpy as np
from PIL import Image

# TensorFlow is imported lazily inside load() to avoid slow startup if not needed
_tf = None


URGENCIA = {
    "buen_estado": "ninguna",
    "suciedad_leve": "secundaria — sin deterioro estructural",
    "suciedad_grave": "secundaria — sin deterioro estructural",
    "deterioro_leve": "PRIORITARIA — deterioro estructural",
    "deterioro_grave": "CRÍTICA — deterioro estructural grave",
}

COLORES = {
    "buen_estado": "#2ecc71",
    "suciedad_leve": "#f1c40f",
    "suciedad_grave": "#e67e22",
    "deterioro_leve": "#e74c3c",
    "deterioro_grave": "#8e44ad",
}

RECOMENDACIONES = {
    "buen_estado": "Sin intervención requerida. Mantenimiento preventivo anual.",
    "suciedad_leve": "Limpieza superficial con agua destilada y cepillo suave. Inspección semestral.",
    "suciedad_grave": "Limpieza profunda con métodos físico-químicos no abrasivos. Plazo: 3 meses.",
    "deterioro_leve": "Consolidación superficial con mortero compatible. Plazo: 1 mes.",
    "deterioro_grave": "INTERVENCIÓN URGENTE. Consolidación estructural. Restricción de acceso recomendada.",
}

# Weight used for heatmap aggregation (0–1 severity scale)
HEATMAP_WEIGHT = {
    "buen_estado": 0.1,
    "suciedad_leve": 0.25,
    "suciedad_grave": 0.45,
    "deterioro_leve": 0.75,
    "deterioro_grave": 1.0,
}


class SillarNetModel:
    def __init__(self):
        self._model = None
        self._class_names: list[str] = []
        self._loaded = False

    def load(self, model_path: Path, classes_path: Path) -> None:
        global _tf
        import tensorflow as tf
        _tf = tf

        print(f"Loading model from: {model_path}")
        self._model = tf.keras.models.load_model(str(model_path))
        self._class_names = classes_path.read_text().splitlines()
        self._loaded = True
        print(f"Model loaded. Classes: {self._class_names}")

    def _preprocess(self, image_bytes: bytes) -> "np.ndarray":
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        arr = np.array(img, dtype=np.float32) / 255.0
        return np.expand_dims(arr, axis=0)

    def _predict_sync(self, image_bytes: bytes) -> dict:
        tensor = self._preprocess(image_bytes)
        predictions = self._model.predict(tensor, verbose=0)[0]

        idx = int(np.argmax(predictions))
        clase = self._class_names[idx]
        confidence = round(float(predictions[idx]) * 100, 1)

        top5 = [
            {"clase": self._class_names[i], "probabilidad": round(float(predictions[i]) * 100, 1)}
            for i in np.argsort(predictions)[::-1]
        ]

        return {
            "predicted_class": clase,
            "confidence": confidence,
            "color": COLORES[clase],
            "urgency": URGENCIA[clase],
            "recommendation": RECOMENDACIONES[clase],
            "is_deterioration": clase.startswith("deterioro"),
            "needs_maintenance": clase != "buen_estado",
            "top5": top5,
            "heatmap_weight": HEATMAP_WEIGHT.get(clase, 0.5),
        }

    async def predict(self, image_bytes: bytes) -> dict:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._predict_sync, image_bytes)


_model_instance = SillarNetModel()


def get_model() -> SillarNetModel:
    return _model_instance
