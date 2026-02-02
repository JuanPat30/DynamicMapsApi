/**
 * Configuración centralizada de la aplicación.
 * Prioriza valores inyectados en runtime para compatibilidad con contenedores (Cloud Run).
 */

const getEnv = (key, placeholder) => {
    // 1. Buscar en el objeto inyectado en runtime (index.html)
    const runtimeConfig = window.APP_CONFIG || {};
    const runtimeValue = runtimeConfig[key];

    // Si el valor existe y no es el placeholder original del Dockerfile, lo usamos
    if (runtimeValue && runtimeValue !== placeholder) {
        return runtimeValue;
    }

    // 2. Fallback a variables de compilacion de Vite (import.meta.env)
    const viteKey = `VITE_GOOGLE_MAPS_${key}`; // Intento de mapeo automatico
    const viteValue = import.meta.env[viteKey] || import.meta.env[`VITE_${key}`];

    if (viteValue) return viteValue;

    return undefined;
};

export const Config = {
    apiKey: getEnv('API_KEY', '__VITE_GOOGLE_MAPS_API_KEY__'),
    mapId: getEnv('MAP_ID', '__VITE_GOOGLE_MAPS_MAP_ID__'),
    defaultLocation: {
        lat: parseFloat(getEnv('DEFAULT_LAT', '__VITE_DEFAULT_LAT__') || '40.7484'),
        lng: parseFloat(getEnv('DEFAULT_LNG', '__VITE_DEFAULT_LNG__') || '-73.9857'),
    },
    app: {
        env: getEnv('APP_ENV', '__VITE_APP_ENV__') || 'development',
        isDev: (getEnv('APP_ENV', '__VITE_APP_ENV__') || 'development') === 'development',
    },
    gcp: {
        projectId: import.meta.env.GOOGLE_CLOUD_PROJECT || 'unknown',
    }
};

// Fail-fast profesional
if (!Config.apiKey) {
    throw new Error("MISSING_ENV_VAR: La variable de entorno VITE_GOOGLE_MAPS_API_KEY es obligatoria.");
}
