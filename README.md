# 🗺️ Google Maps Dynamic Loader - Hexagonal Architecture

Este proyecto es una aplicación frontend moderna diseñada para integrar la **Google Maps JavaScript API** (incluyendo capacidades vectoriales y 3D) utilizando una **Arquitectura Hexagonal (Clean Architecture)** y un sistema de **inyección de configuración en tiempo de ejecución (Runtime Injection)** listo para la nube (GCP Cloud Run).

---

## 🏛️ Arquitectura y Patrones

El proyecto se basa en la separación de intereses para garantizar que el código sea testeable, mantenible y agnóstico a proveedores externos.

### Capas:
-   **`src/core/ports`**: Define las interfaces (contratos). Aquí es donde vive la lógica de lo que la aplicación *necesita* (ej: un servicio de mapas, un logger, un servicio de API).
-   **`src/infrastructure/adapters`**: Implementaciones concretas de los puertos. Por ejemplo, el adaptador de Google Maps o el adaptador de Fetch para peticiones HTTP.
-   **`src/config`**: Gestión centralizada de la configuración que actúa como el "pegamento" del sistema.

### Patrón: Runtime Configuration Injection
A diferencia de las aplicaciones SPA tradicionales que "queman" las variables de entorno durante el build (`npm run build`), este proyecto inyecta los valores **al arrancar el contenedor**. Esto permite:
1.  Usar la misma imagen Docker para múltiples entornos (Dev, Test, Prod).
2.  Cambiar credenciales y secretos sin recompilar el código.
3.  Seguridad total al no exponer secretos en el código fuente.

---

## ⚙️ Configuración y Variables de Entorno

La aplicación consume variables que pueden venir de un archivo `.env` (Local) o de variables de entorno de Cloud Run (Nube).

| Variable | Tipo | Propósito |
| :--- | :--- | :--- |
| `VITE_GOOGLE_MAPS_API_KEY` | **Secreto** | Llave de acceso a Google Maps API. |
| `VITE_GOOGLE_MAPS_MAP_ID` | **Secreto** | ID del mapa vectorial para funciones 3D. |
| `VITE_AUTH_USERNAME` | **Secreto** | Usuario para autenticación con el backend. |
| `VITE_AUTH_PASSWORD` | **Secreto** | Contraseña para autenticación con el backend. |
| `VITE_BACKEND_URL` | Config | URL base del servicio backend. |
| `VITE_API_V1_PATH` | Config | Path de la API (defecto: `/api/v1`). |
| `VITE_APP_ENV` | Config | Entorno (`production` o `development`). |
| `VITE_DEFAULT_LAT` | Config | Latitud inicial del mapa. |
| `VITE_DEFAULT_LNG` | Config | Longitud inicial del mapa. |

---

## 🚀 Guía de Desarrollo Local

### 1. Prerrequisitos
-   Docker y Docker Compose (Recomendado).
-   Node.js 20+ (Opcional).

### 2. Ejecución con Docker (Recomendado)
Para levantar el entorno completo con recarga en caliente:
```bash
docker-compose up --build
```
La aplicación estará disponible en `http://localhost:8081`.

### 3. Ejecución con Node/NPM
Si prefieres correrlo sin Docker:
```bash
npm install
npm run dev
```

---

## 🧪 Pruebas Unitarias

El proyecto utiliza **Vitest** y **JSDOM** para garantizar la calidad del código sin necesidad de un navegador real.

### Ejecutar pruebas localmente:
```bash
npm test
```

### Ejecutar pruebas con Docker:
Si no tienes Node instalado, puedes usar este comando para correr los tests en un contenedor:
```bash
docker run --rm -v %cd%:/app -w /app node:20-alpine npm test -- --run
```

---

## ☁️ Despliegue en Google Cloud Run

El despliegue está automatizado para funcionar con **GCP Secret Manager**.

### 1. Preparación de Secretos
Asegúrate de tener los siguientes secretos creados en tu proyecto de GCP:
-   `GOOGLE_MAPS_API_KEY`
-   `VITE_GOOGLE_MAPS_MAP_ID`
-   `AUTH_USERNAME`
-   `AUTH_PASSWORD`

### 2. Sincronización de Secretos
Puedes usar el script para subir versiones de tus secretos desde el `.env` local:
```bash
.\set-secrets.bat
```

### 3. Despliegue Final
El script `deploy.bat` realiza el build en la nube (Cloud Build) y despliega el servicio en Cloud Run, mapeando automáticamente los secretos y configuraciones:
```bash
.\deploy.bat
```

---

## 📂 Estructura del Proyecto

```text
├── src/
│   ├── core/              # Lógica de negocio y definiciones (Puertos)
│   ├── infrastructure/    # Implementaciones externas (Adaptadores)
│   ├── config/            # Orquestación de variables y servicios
│   └── main.js            # Punto de entrada de la aplicación
├── tests/                 # Pruebas unitarias (Vitest)
├── Dockerfile             # Configuración de imagen (Inyección en runtime)
├── docker-compose.yml     # Orquestación local
├── vitest.config.js       # Configuración de testing
├── deploy.bat             # Script de despliegue automatizado para Windows
└── nginx.conf             # Configuración del servidor web de producción
```
