# SillarNet

Sistema de monitoreo y clasificación de patologías en estructuras de sillar del Centro Histórico de Arequipa.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | FastAPI + SQLAlchemy 2 (async) + PostgreSQL + JWT |
| ML | TensorFlow/Keras (modelo pre-entrenado, 5 clases) |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Mapa | react-leaflet + leaflet-heat (OpenStreetMap) |
| Base de datos | PostgreSQL 16 (via Docker Compose) |

## Requisitos previos

- Python 3.10+
- Node.js 18+
- Docker Desktop

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/sharonconpan/SillarNet
cd SillarNet
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

### 3. Levantar la base de datos

```bash
docker compose up -d
```

PostgreSQL queda disponible en `localhost:5432`.

### 4. Instalar dependencias del backend

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

### 5. Aplicar migraciones de base de datos

> Requiere que la venv esté activa y que la base de datos esté corriendo (paso 3).

```bash
cd backend
alembic upgrade head
cd ..
```

Para verificar que las migraciones se aplicaron correctamente:

```bash
cd backend
alembic current
cd ..
```

Debe mostrar algo como: `006 (head)`.

### 6. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

---

## Ejecución (desarrollo)

Levanta la base de datos primero (si no está corriendo):

```bash
docker compose up -d
```

Luego abre **dos terminales**:

**Terminal 1 — Backend:**
```bash
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Accede en: **http://localhost:5173**

---

## Funcionalidades

- **Mapa interactivo público** — Centro Histórico de Arequipa con heatmap de deterioro (verde → morado por severidad)
- **Clasificación de imágenes** — Sube una foto de sillar, obtén la clase, confianza, gráfico top-5 y alerta de deterioro
- **Geolocalización** — Etiqueta cada análisis con coordenadas GPS reales
- **Historial por usuario** — Pestañas: Pendientes / Completados / Descartados
- **Flujo de conservación** — Al marcar un análisis como Completado, el sistema sugiere re-analizar el sitio para verificar la reparación
- **PWA** — Instalable en Android/iOS desde el navegador

## Clases del modelo

| Clase | Urgencia | Color |
|---|---|---|
| buen_estado | Ninguna | 🟢 Verde |
| suciedad_leve | Secundaria | 🟡 Amarillo |
| suciedad_grave | Secundaria | 🟠 Naranja |
| deterioro_leve | PRIORITARIA | 🔴 Rojo |
| deterioro_grave | CRÍTICA | 🟣 Morado |
