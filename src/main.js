import { Config } from './config/env.js';
import { ConsoleLoggerAdapter } from './infrastructure/adapters/ConsoleLoggerAdapter.js';
import { GoogleMapsAdapter } from './infrastructure/adapters/GoogleMapsAdapter.js';

/**
 * Bootstrap de la aplicación.
 * Centraliza la instanciación de dependencias (Dependency Injection Container manual).
 */
class App {
    constructor() {
        this.logger = new ConsoleLoggerAdapter();
        this.maps = new GoogleMapsAdapter(Config, this.logger);
        this.ui = {
            mapContainerId: 'map',
            loaderId: 'loader'
        };
    }

    async run() {
        const loader = document.getElementById(this.ui.loaderId);
        
        try {
            this.logger.info(`Iniciando Aplicación en modo: ${Config.app.env}`);
            
            // Inicializar mapa
            await this.maps.initMap(this.ui.mapContainerId);

            // Ocultar loader tras carga exitosa
            if (loader) loader.classList.add('hidden');

            // Lógica de negocio inicial: Marcador principal
            this.maps.addMarker(Config.defaultLocation, "Sede Central");
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
