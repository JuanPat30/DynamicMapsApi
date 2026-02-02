# Google Maps Dynamic Loader - Hexagonal Architecture [Test Environment]

Este proyecto es una implementación de referencia para la integración de **Google Maps JavaScript API** utilizando capacidades modernas de mapas vectoriales y una arquitectura robusta lista para la nube.

## 🏛️ Arquitectura y Patrones de Diseño

La solución sigue los principios de **Clean Architecture** para desacoplar la lógica de negocio de los detalles de infraestructura:

-   **Core (Ports):** Define las interfaces abstractas (ej. `ILogger.js`).
-   **Infrastructure (Adapters):** Implementaciones concretas (ej. `GoogleMapsAdapter.js`).
-   **Runtime Configuration Injection:** A diferencia de las apps estáticas tradicionales, este proyecto utiliza un sistema de inyección en tiempo de ejecución. Esto permite que las variables de entorno de Cloud Run afecten al mapa sin necesidad de re-compilar el código.

## 🚀 Características Técnicas Avanzadas

### 🗺️ Renderizado Vectorial y 3D
-   **Perspectiva Avanzada:** Soporte nativo para **Tilt** (inclinación) y **Heading** (rotación).
-   **Visualización 3D:** Optimizado para edificios 3D en zonas de alta densidad (ej. Manhattan).
-   **Dynamic Loading:** Uso de `@googlemaps/js-api-loader` para optimizar la carga del SDK.

### 🐳 Docker & Cloud-Native (GCP Cloud Run)
-   **Despliegue Directo:** El script `deploy.bat` utiliza `gcloud run deploy --source`, automatizando la construcción y el despliegue en un solo paso.
-   **Inyección de Secretos:** Integración nativa con **GCP Secret Manager** para inyectar la API Key y el Map ID de forma segura al arrancar el contenedor.

## 🛡️ Seguridad y Mejores Prácticas

Aunque las API Keys de frontend son visibles en el navegador por diseño, se deben seguir estas prácticas de **Hardening**:

1.  **Restricciones de HTTP Referrer:** En la Consola de GCP, configure la API Key para que solo acepte peticiones desde su dominio de Cloud Run (`*.run.app`).
2.  **Restricciones de API:** Limite la llave únicamente a "Maps JavaScript API".
3.  **Secret Manager:** Nunca guarde llaves en el código fuente. Este proyecto utiliza Secret Manager para todas las credenciales sensibles.

## ⚙️ Configuración del Entorno

| Variable | Fuente Recomendada | Propósito |
| :--- | :--- | :--- |
| `VITE_GOOGLE_MAPS_API_KEY` | Secret Manager | Llave de acceso a Maps |
| `VITE_GOOGLE_MAPS_MAP_ID` | Secret Manager | ID de Mapa Vectorial |
| `VITE_APP_ENV` | Variable de Entorno | Entorno (production/development) |

## 🛠️ Scripts de Automatización (Windows)

-   `set-secrets.bat`: Sincroniza tu Map ID local desde `.env` hacia GCP Secret Manager.
-   `deploy.bat`: Realiza el despliegue completo hacia Google Cloud Run.

---
**Nota:** Proyecto desarrollado como entorno de pruebas técnico para validación de capacidades 3D y arquitectura hexagonal.
