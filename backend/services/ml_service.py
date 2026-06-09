import asyncio
import io
from pathlib import Path

import numpy as np
from PIL import Image

_tf = None

CLASS_NAMES = ['ninguno', 'leve', 'grave']
PESOS = {'ninguno': 0, 'leve': 50, 'grave': 100}

COLORES = {
    "ninguno":         "#5E8A5C",
    "suciedad_leve":   "#C9973A",
    "suciedad_grave":  "#C07030",
    "deterioro_leve":  "#B84020",
    "deterioro_grave": "#7C1D12",
}

URGENCIA = {
    "ninguno":         "Sin patologías detectadas",
    "suciedad_leve":   "Secundaria — suciedad superficial leve",
    "suciedad_grave":  "Secundaria — suciedad superficial grave",
    "deterioro_leve":  "PRIORITARIA — deterioro estructural",
    "deterioro_grave": "CRÍTICA — deterioro estructural grave",
}

RECOMENDACIONES = {
    "ninguno": (
        "La estructura presenta condiciones óptimas de conservación. "
        "Se recomienda mantener un programa de inspección preventiva anual "
        "para monitorear posibles cambios en el estado del sillar."
    ),
    "suciedad_leve": (
        "Se detecta acumulación superficial de polvo o depósitos biológicos de baja densidad. "
        "Se recomienda limpieza con agua desmineralizada y cepillo de cerdas suaves, "
        "evitando productos abrasivos que puedan afectar la porosidad del sillar. "
        "Inspección de seguimiento en 6 meses."
    ),
    "suciedad_grave": (
        "Presencia significativa de costras, eflorescencias o colonización biológica "
        "que compromete la superficie del sillar. Se requiere limpieza especializada "
        "con métodos físico-químicos compatibles con la piedra volcánica, aplicados "
        "por personal técnico capacitado. Plazo recomendado: dentro de 3 meses."
    ),
    "deterioro_leve": (
        "Deterioro estructural incipiente detectado con riesgo de avance progresivo. "
        "Se recomienda consolidación superficial con mortero de cal compatible, "
        "aplicado por conservadores especializados en patrimonio pétreo. "
        "No diferir la intervención más de 1 mes para evitar agravamiento."
    ),
    "deterioro_grave": (
        "ESTADO CRÍTICO: deterioro estructural avanzado con riesgo de pérdida irreversible "
        "del bien patrimonial. Se requiere intervención inmediata por ingenieros estructurales "
        "y especialistas en conservación. Restricción de acceso a la zona afectada "
        "hasta la conclusión de la intervención de emergencia."
    ),
}

HEATMAP_WEIGHT = {
    "ninguno":         0.1,
    "suciedad_leve":   0.35,
    "suciedad_grave":  0.55,
    "deterioro_leve":  0.75,
    "deterioro_grave": 1.0,
}


def _calcular_indice(probs_dict: dict) -> float:
    return round(
        PESOS['ninguno'] * probs_dict['ninguno'] / 100
        + PESOS['leve']  * probs_dict['leve']    / 100
        + PESOS['grave'] * probs_dict['grave']   / 100,
        2,
    )


class SillarNetDualModel:
    def __init__(self):
        self._model_det = None
        self._model_suc = None
        self._loaded = False

    def load(self, model_deterioro_path: Path, model_suciedad_path: Path) -> None:
        global _tf
        import tensorflow as tf
        _tf = tf

        print(f"Loading deterioro model : {model_deterioro_path}")
        self._model_det = tf.keras.models.load_model(str(model_deterioro_path))
        print(f"Loading suciedad  model : {model_suciedad_path}")
        self._model_suc = tf.keras.models.load_model(str(model_suciedad_path))
        self._loaded = True
        print(f"✅ Both models loaded. Classes: {CLASS_NAMES}")

    def _preprocess(self, image_bytes: bytes) -> "np.ndarray":
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        # No /255 — EfficientNetB0 handles normalisation internally
        arr = np.array(img, dtype=np.float32)
        return np.expand_dims(arr, axis=0)

    def _predict_sync(self, image_bytes: bytes) -> dict:
        tensor = self._preprocess(image_bytes)

        # — Deterioro model —
        pred_det   = self._model_det.predict(tensor, verbose=0)[0]
        probs_det  = {CLASS_NAMES[i]: round(float(pred_det[i]) * 100, 1) for i in range(3)}
        clase_det  = CLASS_NAMES[int(np.argmax(pred_det))]
        indice_det = _calcular_indice(probs_det)

        # — Suciedad model —
        pred_suc   = self._model_suc.predict(tensor, verbose=0)[0]
        probs_suc  = {CLASS_NAMES[i]: round(float(pred_suc[i]) * 100, 1) for i in range(3)}
        clase_suc  = CLASS_NAMES[int(np.argmax(pred_suc))]
        indice_suc = _calcular_indice(probs_suc)

        # — Combined class (deterioro takes priority as structural risk) —
        if clase_det != "ninguno":
            predicted_class = f"deterioro_{clase_det}"
            confidence      = round(float(np.max(pred_det)) * 100, 1)
        elif clase_suc != "ninguno":
            predicted_class = f"suciedad_{clase_suc}"
            confidence      = round(float(np.max(pred_suc)) * 100, 1)
        else:
            predicted_class = "ninguno"
            confidence      = round(max(float(np.max(pred_det)), float(np.max(pred_suc))) * 100, 1)

        return {
            "predicted_class":  predicted_class,
            "confidence":       confidence,
            "color":            COLORES[predicted_class],
            "urgency":          URGENCIA[predicted_class],
            "recommendation":   RECOMENDACIONES[predicted_class],
            "is_deterioration": predicted_class.startswith("deterioro"),
            "heatmap_weight":   HEATMAP_WEIGHT[predicted_class],
            "deterioro_clase":  clase_det,
            "deterioro_indice": indice_det,
            "suciedad_clase":   clase_suc,
            "suciedad_indice":  indice_suc,
            "probs": {
                "deterioro": probs_det,
                "suciedad":  probs_suc,
            },
        }

    async def predict(self, image_bytes: bytes) -> dict:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._predict_sync, image_bytes)


_model_instance = SillarNetDualModel()


def get_model() -> SillarNetDualModel:
    return _model_instance
