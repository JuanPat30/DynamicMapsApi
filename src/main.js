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
            const markerTitle = (enrichedData.data || enrichedData).formatted_address || "Sede Central";
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
            } else if (param.type === 'json') {
                input = document.createElement('textarea');
                input.className = 'json-input';
                input.value = param.default || '';
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
            } else if (param.type === 'json') {
                try {
                    params[param.name] = JSON.parse(input.value);
                } catch (e) {
                    throw new Error(`JSON inválido en el campo ${param.label}`);
                }
            } else {
                params[param.name] = input.value;
            }
        });

        try {
            this.ui.executeBtn.disabled = true;
            this.ui.executeBtn.textContent = 'Ejecutando...';
            
            // Limpiar mapa antes de procesar nuevos resultados
            this.maps.clearMap();

            this.ui.responseViewer.classList.remove('hidden');
            this.ui.responseViewer.textContent = 'Enviando petición...';

            this.logger.info(`Ejecutando servicio: ${service.method}`, params);
            
            let result;
            if (service.method === 'enrichLocation') {
                result = await this.api.enrichLocation(params.latitude, params.longitude, params.generateMap);
                const data = result.data || result;
                if (data.latitude && data.longitude) {
                    const pos = { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
                    this.maps.addMarker(pos, data.formatted_address || "Resultado");
                    this.maps.moveTo(pos);
                }
            } else if (service.method === 'geocode') {
                result = await this.api.geocode(params.address);
                const data = result.data || result;
                if (data.latitude && data.longitude) {
                    const pos = { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
                    this.maps.addMarker(pos, data.formatted_address || params.address);
                    this.maps.moveTo(pos);
                }
            } else if (service.method === 'cleanPath') {
                const points = params.pointsJson;
                result = await this.api.cleanPath(points);
                const data = result.data || result;
                if (data.snapped_path && data.snapped_path.length > 0) {
                    this.maps.addPolyline(points, "#FF0000", 2);
                    this.maps.addPolyline(data.snapped_path, "#00FF00", 4);
                    const firstPoint = data.snapped_path[0];
                    this.maps.moveTo(firstPoint, 18);
                }
            } else if (service.method === 'auditRoute') {
                const routeData = params.routeJson;
                result = await this.api.auditRoute(routeData);
                const data = result.data || result;

                if (data.polyline) {
                    const polyline = this.maps.addEncodedPolyline(data.polyline, "#0000FF", 5);
                    if (polyline) {
                        const pathArray = polyline.getPath().getArray();
                        if (pathArray.length > 0) {
                            this.maps.moveTo(pathArray[0], 17);
                        }

                        if (routeData.waypoints && Array.isArray(routeData.waypoints)) {
                            routeData.waypoints.forEach(async (wp) => {
                                try {
                                    const geoResult = await this.api.geocode(wp);
                                    const geoData = geoResult.data || geoResult;
                                    if (geoData.latitude && geoData.longitude) {
                                        const pos = { lat: parseFloat(geoData.latitude), lng: parseFloat(geoData.longitude) };
                                        this.maps.addMarker(pos, `WP: ${wp}`);
                                    }
                                } catch (e) {
                                    this.logger.warn(`Fallo geocode WP: ${wp}`);
                                }
                            });
                        }
                    }
                }
            } else if (service.method === 'searchPlaces') {
                const searchData = params.searchJson;
                result = await this.api.searchPlaces(searchData);
                const data = result.data || result;

                if (data.places && Array.isArray(data.places)) {
                    const locations = [];
                    data.places.forEach(place => {
                        if (place.location) {
                            const pos = { 
                                lat: parseFloat(place.location.latitude), 
                                lng: parseFloat(place.location.longitude) 
                            };
                            const title = place.displayName?.text || place.formattedAddress || "Lugar Encontrado";
                            this.maps.addMarker(pos, title);
                            locations.push(pos);
                        }
                    });

                    if (locations.length > 0) {
                        this.maps.moveTo(locations[0], 17);
                    }
                }
            } else if (service.method === 'getDirections') {
                const directionsData = params.directionsJson;
                result = await this.api.getDirections(directionsData);
                const data = result.data || result;

                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    if (route.overview_polyline && route.overview_polyline.points) {
                        this.maps.addEncodedPolyline(route.overview_polyline.points, "#FF8C00", 6);
                        if (route.legs && route.legs.length > 0) {
                            const leg = route.legs[0];
                            this.maps.addMarker(leg.start_location, "INICIO: " + leg.start_address);
                            this.maps.addMarker(leg.end_location, "FIN: " + leg.end_address);
                            this.maps.moveTo(leg.start_location, 16);
                        }
                    }
                }
            } else if (service.method === 'getDistanceMatrix') {
                const matrixData = params.matrixJson;
                result = await this.api.getDistanceMatrix(matrixData);
                const data = result.data || result;

                const allPoints = [];
                
                // Procesar Orígenes
                if (data.origin_addresses) {
                    for (const addr of data.origin_addresses) {
                        try {
                            const geo = await this.api.geocode(addr);
                            const gData = geo.data || geo;
                            if (gData.latitude && gData.longitude) {
                                const pos = { lat: parseFloat(gData.latitude), lng: parseFloat(gData.longitude) };
                                this.maps.addMarker(pos, `ORIGEN: ${addr}`);
                                allPoints.push(pos);
                            }
                        } catch (e) { this.logger.warn(`Fallo geocode origen: ${addr}`); }
                    }
                }

                // Procesar Destinos
                if (data.destination_addresses) {
                    for (const addr of data.destination_addresses) {
                        try {
                            const geo = await this.api.geocode(addr);
                            const gData = geo.data || geo;
                            if (gData.latitude && gData.longitude) {
                                const pos = { lat: parseFloat(gData.latitude), lng: parseFloat(gData.longitude) };
                                this.maps.addMarker(pos, `DESTINO: ${addr}`);
                                allPoints.push(pos);
                            }
                        } catch (e) { this.logger.warn(`Fallo geocode destino: ${addr}`); }
                    }
                }

                if (allPoints.length > 0) {
                    this.maps.fitBounds(allPoints);
                }
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
                this.ui.responseViewer.classList.remove('hidden');
                this.ui.responseViewer.textContent = `Consultando ubicación: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}...`;
                this.ui.serviceSelector.value = 'enrichLocation';
                this.renderServiceForm('enrichLocation');
                
                const result = await this.api.enrichLocation(coords.lat, coords.lng, false);
                const data = result.data || result;

                this.ui.responseViewer.textContent = JSON.stringify(result, null, 2);
                
                const title = data.formatted_address || data.display_name || `Punto: ${coords.lat.toFixed(4)}`;
                this.maps.addMarker(coords, title);
                this.maps.moveTo(coords, 18);

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
