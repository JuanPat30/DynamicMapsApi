export const Config = {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    defaultLocation: {
        lat: parseFloat(import.meta.env.VITE_DEFAULT_LAT || 0),
        lng: parseFloat(import.meta.env.VITE_DEFAULT_LNG || 0),
    },
    isDev: import.meta.env.VITE_APP_ENV === 'development',
};

// Fail-fast: Si no hay API Key, detenemos la app inmediatamente.
if (!Config.apiKey) {
    throw new Error("CRITICAL: VITE_GOOGLE_MAPS_API_KEY is missing in environment variables.");
}