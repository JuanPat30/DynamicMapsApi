import { Config } from './config/env.js';
import { ConsoleLoggerAdapter } from './infrastructure/adapters/ConsoleLoggerAdapter.js';
import { GoogleMapsAdapter } from './infrastructure/adapters/GoogleMapsAdapter.js';

// 1. Instanciación de Adaptadores (Inyección de Dependencias)
const logger = new ConsoleLoggerAdapter();
const mapsAdapter = new GoogleMapsAdapter(Config, logger);

// 2. Ejecución Principal
(async () => {
    try {
        logger.info("Iniciando Aplicación de Mapas...");
        
        // Inicializar mapa
        await mapsAdapter.initMap('map');

        // Agregar marcador en la posición default
        mapsAdapter.addMarker(Config.defaultLocation, "Sede Central");

    } catch (error) {
        logger.error("Error fatal en la aplicación", error);
        // Aquí podrías mostrar un fallback UI al usuario (ej. "Mapa no disponible")
        document.getElementById('map').innerHTML = `<div class="error">Lo sentimos, el mapa no pudo cargarse.</div>`;
    }
})();