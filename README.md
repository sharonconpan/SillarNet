# Sistema Propuesto

Para abordar la problemática de la inspección del patrimonio construido en sillar, este proyecto implementa una arquitectura híbrida basada en visión por computadora y aprendizaje profundo para la detección y clasificación automática de patologías en estructuras de sillar. El sistema integra un modelo de inteligencia artificial entrenado sobre un dataset especializado y una aplicación web que permite visualizar los resultados y apoyar la toma de decisiones en tareas de monitoreo, conservación y gestión del riesgo.

## Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd SillarNet
```

### 2. Instalar Python 3.10

```bash
py install 3.10
```

### 3. Crear y activar el entorno virtual

```bash
py -3.10 -m venv sillar_tf310
sillar_tf310\Scripts\activate
```

### 4. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 5. Iniciar el servidor

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

## Acceso a la Aplicación

Una vez iniciado el servidor, abre tu navegador y accede a:

```text
http://localhost:8000
```

## Funcionalidades

- Detección automática de patologías en estructuras de sillar.
- Clasificación de imágenes mediante modelos de Deep Learning.
- Visualización de resultados a través de una interfaz web interactiva.
- Soporte para monitoreo y evaluación del estado de conservación del patrimonio arquitectónico.
