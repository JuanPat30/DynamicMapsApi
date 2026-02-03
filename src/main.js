import { Config } from './config/env.js';
import { ServiceRegistry } from './config/services.js';
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
            loaderId: 'loader',
            serviceSelector: document.getElementById('service-selector'),
            dynamicForm: document.getElementById('dynamic-form'),
            executeBtn: document.getElementById('execute-btn'),
            responseViewer: document.getElementById('response-viewer')
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
            this.initDynamicUI();
            this.initMapInteractions();

        } catch (error) {
            this.logger.error("Error fatal durante el arranque", error);
            this.handleFatalError(error);
        }
    }

    /**
     * Inicializa la interfaz dinámica para el control de servicios.
     */
    initDynamicUI() {
        if (!this.ui.serviceSelector) return;

        // 1. Llenar el selector de servicios
        ServiceRegistry.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.name;
            this.ui.serviceSelector.appendChild(option);
        });

        // 2. Escuchar cambios en el selector
        this.ui.serviceSelector.addEventListener('change', (e) => {
            this.renderServiceForm(e.target.value);
        });

        // 3. Escuchar clic en ejecutar
        this.ui.executeBtn.addEventListener('click', () => {
            this.executeSelectedService();
        });
    }

    /**
     * Renderiza los inputs necesarios para el servicio seleccionado.
     */
    renderServiceForm(serviceId) {
        const service = ServiceRegistry.find(s => s.id === serviceId);
        this.ui.dynamicForm.innerHTML = '';
        
        if (!service) {
            this.ui.dynamicForm.innerHTML = '<p style="font-size: 0.8rem; color: #666; text-align: center;">Seleccione un servicio para configurar parámetros.</p>';
            this.ui.executeBtn.disabled = true;
            return;
        }

        service.params.forEach(param => {
            const group = document.createElement('div');
            group.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = param.label;
            
            let input;
            if (param.type === 'boolean') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = param.default;
            } else {
                input = document.createElement('input');
                input.type = param.type;
                input.value = param.default || '';
                if (param.placeholder) input.placeholder = param.placeholder;
                if (param.step) input.step = param.step;
            }
            
            input.name = param.name;
            input.id = `input-${param.name}`;

            group.appendChild(label);
            group.appendChild(input);
            this.ui.dynamicForm.appendChild(group);
        });

        this.ui.executeBtn.disabled = false;
    }

    /**
     * Recopila los datos del formulario y ejecuta el método del adaptador.
     */
    async executeSelectedService() {
        const serviceId = this.ui.serviceSelector.value;
        const service = ServiceRegistry.find(s => s.id === serviceId);
        if (!service) return;

        const params = {};
        service.params.forEach(param => {
            const input = document.getElementById(`input-${param.name}`);
            if (param.type === 'boolean') {
                params[param.name] = input.checked;
            } else if (param.type === 'number') {
                params[param.name] = parseFloat(input.value);
            } else {
                params[param.name] = input.value;
            }
        });

        try {
            this.ui.executeBtn.disabled = true;
            this.ui.executeBtn.textContent = 'Ejecutando...';
            this.ui.responseViewer.classList.remove('hidden');
            this.ui.responseViewer.textContent = 'Enviando petición...';

            this.logger.info(`Ejecutando servicio: ${service.method}`, params);
            
            let result;
            if (service.method === 'enrichLocation') {
                result = await this.api.enrichLocation(params.latitude, params.longitude, params.generateMap);
            } else if (service.method === 'geocode') {
                result = await this.api.geocode(params.address);
            }

            // Normalizar respuesta (el backend suele envolver en "data")
            const locationData = result.data || result;
            
            if (locationData.latitude && locationData.longitude) {
                const pos = { 
                    lat: parseFloat(locationData.latitude), 
                    lng: parseFloat(locationData.longitude) 
                };
                
                const title = locationData.formatted_address || locationData.display_name || params.address || "Ubicación";
                
                this.maps.addMarker(pos, title);
                this.maps.moveTo(pos);
            }

            this.ui.responseViewer.textContent = JSON.stringify(result, null, 2);
            this.logger.info(`Resultado de ${service.method}:`, result);

        } catch (error) {
            this.logger.error(`Error ejecutando ${service.method}`, error);
            this.ui.responseViewer.textContent = `ERROR: ${error.message}`;
        } finally {
            this.ui.executeBtn.disabled = false;
            this.ui.executeBtn.textContent = 'Ejecutar Servicio';
        }
    }

    /**
     * Inicializa los listeners para interactuar directamente con el mapa.
     */
    initMapInteractions() {
        this.maps.onMapClick(async (coords) => {
            this.logger.info("Mapa clickeado, consultando datos enriquecidos...");
            
            try {
                // 1. Mostrar estado en el panel
                this.ui.responseViewer.classList.remove('hidden');
                this.ui.responseViewer.textContent = `Consultando ubicación: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}...`;
                this.ui.serviceSelector.value = 'enrichLocation';
                this.renderServiceForm('enrichLocation');
                
                // 2. Ejecutar servicio de enriquecimiento
                const result = await this.api.enrichLocation(coords.lat, coords.lng, false);
                const locationData = result.data || result;

                // 3. Mostrar resultados
                this.ui.responseViewer.textContent = JSON.stringify(result, null, 2);
                
                // 4. Agregar marcador y centrar
                const title = locationData.formatted_address || locationData.display_name || `Punto: ${coords.lat.toFixed(4)}`;
                this.maps.addMarker(coords, title);
                this.maps.moveTo(coords);

            } catch (error) {
                this.logger.error("Error al enriquecer punto clickeado", error);
                this.ui.responseViewer.textContent = `ERROR: ${error.message}`;
            }
        });
    }

    handleFatalError(error) {
        const container = document.getElementById(this.ui.mapContainerId);
        if (container) {
            container.innerHTML = `
                <div class="error-msg">
                    <h3>Lo sentimos, ocurrió un error.</h3>
                    <p>${error.message}</p>
                </div>`;
        }
    }
}

// Iniciar aplicación
const app = new App();
app.run();
