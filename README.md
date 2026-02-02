# Implementación Google Dynamic Maps - Hexagonal Architecture

Este proyecto implementa la API de Google Maps JavaScript siguiendo una arquitectura hexagonal (Ports & Adapters) para desacoplar la lógica de negocio de la implementación de la API de Google. Está contenerizado con Docker y sigue prácticas de "Zero Hardcoding".

## 📋 Requisitos Previos

- Docker & Docker Compose
- Node.js 20+ (Solo para desarrollo local sin Docker)
- API Key de Google Cloud con `Maps JavaScript API` habilitada.
- Map ID de Google Cloud (Tipo Vector) para habilitar marcadores avanzados.

## 🚀 Arquitectura

El proyecto sigue el patrón **Puertos y Adaptadores**:

- **Core (Dominio):** Define *qué* debe hacer el sistema (Interfaces de Logger, configuración).
- **Infrastructure (Adaptadores):** Implementa *cómo* se hace (Google Maps SDK, `console.log`, DOM Manipulation).
- **Config:** Centraliza las variables de entorno para evitar valores hardcodeados.

## 🛠️ Configuración (Variables de Entorno)

Crea un archivo `.env` en la raíz basado en `.env.example`:

```bash
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_real
VITE_GOOGLE_MAPS_MAP_ID=tu_map_id_real
VITE_DEFAULT_LAT=4.6097
VITE_DEFAULT_LNG=-74.0817