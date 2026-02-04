/**
 * Adaptador que encapsula TODA la lógica de Google Maps.
 * El resto de la app no sabe que existe "google.maps".
 */
export class GoogleMapsAdapter {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.map = null;
        this.libraries = null;
        this.markers = [];
        this.polylines = [];
    }

    async load() {
        try {
            this.logger.info("Iniciando carga dinámica de Google Maps con Loader...");
            
            const { Loader } = await import('@googlemaps/js-api-loader');
            const loader = new Loader({
                apiKey: this.config.apiKey,
                version: "weekly",
            });

            // Importación dinámica de librerías necesarias
            const [
                { Map, Polyline, LatLngBounds }, 
                { AdvancedMarkerElement, PinElement },
                geometry
            ] = await Promise.all([
                loader.importLibrary("maps"),
                loader.importLibrary("marker"),
                loader.importLibrary("geometry")
            ]);
            
            this.libraries = { Map, Polyline, LatLngBounds, AdvancedMarkerElement, PinElement, geometry };
            this.logger.info("Librerías de Google Maps cargadas correctamente.");
            
        } catch (e) {
            this.logger.error("Fallo crítico cargando librerías de Maps", e);
            throw e;
        }
    }

    async initMap(domElementId) {
        if (!this.libraries) await this.load();

        try {
            const element = document.getElementById(domElementId);
            if (!element) throw new Error(`Elemento DOM #${domElementId} no encontrado`);

            this.map = new this.libraries.Map(element, {
                center: this.config.defaultLocation,
                zoom: 19, // Un poco más cerca para resaltar el 3D
                mapId: this.config.mapId,
                mapTypeId: 'hybrid', // Iniciamos en híbrido para verificar el 3D
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.TOP_LEFT,
                    mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
                },
                // Perspectiva 3D agresiva para resaltar el eje Z
                tilt: 67.5, 
                heading: 45,
                rotateControl: true,
                tiltControl: true,
                // Garantizar que el motor vectorial esté activo
                renderingType: 'VECTOR' 
            });

            this.logger.info("Mapa vectorial renderizado con soporte 3D.");
            return this.map;
        } catch (e) {
            this.logger.error("Error al inicializar el mapa", e);
            throw e;
        }
    }

    addMarker(location, title) {
        try {
            const { AdvancedMarkerElement, PinElement } = this.libraries;
            
            const pin = new PinElement({
                background: "#FBBC04",
                glyphColor: "#000",
                borderColor: "#000",
            });

            const marker = new AdvancedMarkerElement({
                map: this.map,
                position: location,
                title: title,
                content: pin.element
            });

            this.markers.push(marker); // Guardar referencia para limpieza
            this.logger.info(`Marcador agregado en: ${location.lat}, ${location.lng}`);
            return marker;
        } catch (e) {
            this.logger.error("Error agregando marcador", e);
        }
    }

    /**
     * Mueve la cámara del mapa a una ubicación específica.
     * Soporta tanto {lat, lng} simple como objetos google.maps.LatLng nativos.
     */
    moveTo(location, zoom = null) {
        if (!this.map) return;
        
        try {
            let lat, lng;

            // Detectar si es un objeto LatLng nativo (usa funciones lat() / lng())
            if (typeof location.lat === 'function') {
                lat = location.lat();
                lng = location.lng();
            } else {
                lat = parseFloat(location.lat);
                lng = parseFloat(location.lng);
            }

            if (isNaN(lat) || isNaN(lng)) {
                throw new Error("Coordenadas inválidas para mover el mapa");
            }

            const pos = { lat, lng };

            this.logger.info(`Moviendo mapa a: ${pos.lat}, ${pos.lng} ${zoom ? `con zoom: ${zoom}` : ''}`);
            
            // panTo es más suave (animado) que setCenter
            this.map.panTo(pos);
            
            // Ajustar zoom si se proporciona
            if (zoom !== null) {
                this.map.setZoom(zoom);
            }
            
        } catch (e) {
            this.logger.error("Error al mover el mapa", e);
        }
    }

    /**
     * Registra un callback para cuando se hace click en el mapa.
     */
    onMapClick(callback) {
        if (!this.map) {
            this.logger.warn("No se puede registrar click: el mapa no se ha inicializado.");
            return;
        }

        this.map.addListener("click", (e) => {
            const coords = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            };
            this.logger.info("Click detectado en coordenadas:", coords);
            callback(coords);
        });
    }

    /**
     * Dibuja una línea en el mapa.
     */
    addPolyline(path, color = "#FF0000", weight = 3) {
        if (!this.map) return;
        
        try {
            const polyline = new this.libraries.Polyline({
                path: path,
                geodesic: true,
                strokeColor: color,
                strokeOpacity: 1.0,
                strokeWeight: weight,
                map: this.map
            });
            
            this.polylines.push(polyline); // Guardar referencia para limpieza
            this.logger.info(`Línea agregada con ${path.length} puntos.`);
            return polyline;
        } catch (e) {
            this.logger.error("Error al agregar línea", e);
        }
    }

    /**
     * Decodifica una polilínea y la dibuja en el mapa.
     */
    addEncodedPolyline(encodedPath, color = "#0000FF", weight = 4) {
        if (!this.map || !this.libraries.geometry) return;

        try {
            const path = google.maps.geometry.encoding.decodePath(encodedPath);
            this.logger.info(`Polilínea decodificada: ${path.length} puntos.`);
            return this.addPolyline(path, color, weight);
        } catch (e) {
            this.logger.error("Error al decodificar polilínea", e);
        }
    }

    /**
     * Ajusta la vista para mostrar todos los puntos proporcionados.
     */
    fitBounds(points) {
        if (!this.map || !points || points.length === 0) return;

        try {
            const bounds = new this.libraries.LatLngBounds();
            points.forEach(p => bounds.extend(p));
            this.map.fitBounds(bounds);
            this.logger.info("Mapa ajustado a los límites de la traza.");
        } catch (e) {
            this.logger.error("Error al ajustar límites", e);
        }
    }

    /**
     * Limpia todos los elementos dibujados en el mapa.
     */
    clearMap() {
        this.logger.info("Limpiando elementos del mapa...");
        
        // 1. Eliminar marcadores
        this.markers.forEach(m => m.map = null);
        this.markers = [];
        
        // 2. Eliminar líneas
        this.polylines.forEach(p => p.setMap(null));
        this.polylines = [];
    }
}
