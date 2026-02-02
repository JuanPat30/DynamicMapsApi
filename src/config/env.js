/**
 * Configuración centralizada de la aplicación.
 * Implementa validación básica para asegurar que las variables requeridas estén presentes.
 */

const getEnv = (key, defaultValue = undefined) => {
    const value = import.meta.env[key] || defaultValue;
    if (value === undefined) {
        throw new Error(`MISSING_ENV_VAR: La variable de entorno ${key} es obligatoria.`);
    }
    return value;
};

export const Config = {
    apiKey: getEnv('VITE_GOOGLE_MAPS_API_KEY'),
    mapId: getEnv('VITE_GOOGLE_MAPS_MAP_ID'),
    defaultLocation: {
        lat: parseFloat(getEnv('VITE_DEFAULT_LAT', '0')),
        lng: parseFloat(getEnv('VITE_DEFAULT_LNG', '0')),
    },
    app: {
        env: getEnv('VITE_APP_ENV', 'development'),
        isDev: getEnv('VITE_APP_ENV', 'development') === 'development',
    },
    gcp: {
        projectId: import.meta.env.GOOGLE_CLOUD_PROJECT || 'unknown',
    }
};

// Validación de tipos para coordenadas
if (isNaN(Config.defaultLocation.lat) || isNaN(Config.defaultLocation.lng)) {
    throw new Error("INVALID_CONFIG: Las coordenadas por defecto deben ser números válidos.");
}
