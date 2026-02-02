# Google Maps Dynamic Loader - Hexagonal Architecture [Test Environment]

Este proyecto es una implementación de referencia para la integración de **Google Maps JavaScript API** utilizando **Arquitectura Hexagonal (Ports & Adapters)**. Está diseñado para ser altamente modular, testeable y listo para despliegues modernos en la nube (Cloud Run).

## 🏛️ Arquitectura y Patrones de Diseño

La solución sigue los principios de Clean Architecture para desacoplar la lógica de negocio de los detalles de infraestructura:

-   **Core (Ports):** Define las interfaces abstractas (ej. `ILogger.js`). La aplicación interactúa con estas abstracciones, no con implementaciones concretas.
-   **Infrastructure (Adapters):** Contiene las implementaciones específicas.
    -   `GoogleMapsAdapter`: Encapsula el SDK de Google, gestionando la carga dinámica y la renderización vectorial.
    -   `ConsoleLoggerAdapter`: Implementación de logging para el entorno de consola.
-   **Configuración Fail-Fast:** El módulo `env.js` valida la presencia y el tipo de las variables de entorno críticas durante el arranque, evitando fallos silenciosos en producción.
-   **Dependency Injection (Bootstrap):** La clase `App` en `main.js` actúa como el orquestador y contenedor de dependencias, instanciando y vinculando los adaptadores.

## 🚀 Características Técnicas Avanzadas

### 🗺️ Renderizado Vectorial y 3D
-   **Vector Maps:** Configurado para utilizar capacidades de renderizado vectorial mediante `Map ID`.
-   **Perspectiva Avanzada:** Soporte nativo para **Tilt** (inclinación) y **Heading** (rotación).
-   **Visualización 3D:** Optimizado para el renderizado de edificios 3D en zonas de alta densidad (ej. Manhattan) mediante la gestión dinámica del nivel de zoom y propiedades de cámara.

### 🐳 Docker & Cloud-Native (GCP Cloud Run)
-   **Puerto Dinámico:** Configuración de Nginx adaptada para Google Cloud Run. Utiliza `envsubst` en el `Dockerfile` para inyectar la variable de entorno `$PORT` en tiempo de ejecución.
-   **Application Default Credentials (ADC):** Soporte para entornos de desarrollo local mediante el montaje de volúmenes en `docker-compose.yml`, permitiendo que el contenedor utilice las credenciales de `gcloud` del host.
-   **Multi-stage Build:** Proceso de construcción optimizado para generar imágenes de producción ligeras basadas en Alpine Linux.

### 🛠️ Frontend & DX
-   **Vite:** Tooling moderno para un desarrollo rápido y builds optimizados.
-   **Dynamic Loading:** Implementación de `@googlemaps/js-api-loader` para minimizar el bundle inicial y cargar el SDK de Maps solo cuando sea necesario.
-   **UX Robusta:** Incluye un loader visual y un sistema de manejo de errores fatales que informa al usuario final sobre problemas de configuración o conectividad.

## ⚙️ Configuración del Entorno

Copie el archivo de ejemplo y configure sus credenciales:

```bash
cp .env.example .env
```

| Variable | Descripción | Requerido |
| :--- | :--- | :--- |
| `VITE_GOOGLE_MAPS_API_KEY` | API Key con permisos para Maps JS API | Sí |
| `VITE_GOOGLE_MAPS_MAP_ID` | ID de mapa configurado como Vectorial | Sí |
| `GOOGLE_CLOUD_PROJECT` | ID del proyecto en GCP | Opcional |
| `GOOGLE_APPLICATION_CREDENTIALS`| Ruta interna al JSON de credenciales | Opcional |

## 🛠️ Ejecución

### Desarrollo Local (Host)
Requiere Node.js 20+.
```bash
npm install
npm run dev
```

### Docker Compose (Entorno Local Controlado)
```bash
docker-compose up --build
```

---
**Nota:** Este proyecto está marcado como **[Test Environment]** para propósitos de validación de API y pruebas de integración.
