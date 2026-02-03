import { Config } from './config/env.js';
import { ConsoleLoggerAdapter } from './infrastructure/adapters/ConsoleLoggerAdapter.js';
import { GoogleMapsAdapter } from './infrastructure/adapters/GoogleMapsAdapter.js';
import { FetchApiService } from './infrastructure/adapters/FetchApiService.js';

/**
 * Bootstrap de la aplicación.
 * Centraliza la instanciación de dependencias (Dependency Injection Container manual).
 */
class App {
    constructor() {
        this.logger = new ConsoleLoggerAdapter();
        this.maps = new GoogleMapsAdapter(Config, this.logger);
        this.api = new FetchApiService(Config, this.logger);
        this.ui = {
            mapContainerId: 'map',
            loaderId: 'loader'
        };
    }

    async run() {
        const loader = document.getElementById(this.ui.loaderId);
        
        try {
            this.logger.info(`Iniciando Aplicación en modo: ${Config.app.env}`);
            
            // 1. Autenticación con el Backend (Zero Hardcoding)
            await this.api.login(Config.backend.auth.username, Config.backend.auth.password);

            // 2. Inicializar mapa
            await this.maps.initMap(this.ui.mapContainerId);

            // 3. Obtener contextualización de la ubicación inicial
            const enrichedData = await this.api.enrichLocation(
                Config.defaultLocation.lat, 
                Config.defaultLocation.lng
            );
            this.logger.info("Ubicación inicial enriquecida:", enrichedData);

            // Ocultar loader tras carga exitosa
            if (loader) loader.classList.add('hidden');

            // Lógica de negocio inicial: Marcador principal con info del backend
            const markerTitle = enrichedData.display_name || "Sede Central";
            this.maps.addMarker(Config.defaultLocation, markerTitle);
            
            this.logger.info("Aplicación lista.");

        } catch (error) {
            this.logger.error("Error fatal durante el arranque", error);
            this.handleFatalError(error);
        }
    }

    handleFatalError(error) {
        const container = document.getElementById(this.ui.mapContainerId);
        if (container) {
            container.innerHTML = `
                <div class="error">
                    <h3>Lo sentimos, ocurrió un error.</h3>
                    <p>${error.message}</p>
                </div>`;
        }
    }
}

// Iniciar aplicación
const app = new App();
app.run();
