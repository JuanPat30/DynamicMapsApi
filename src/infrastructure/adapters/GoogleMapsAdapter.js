/**
 * Adaptador que encapsula TODA la lógica de Google Maps.
 * El resto de la app no sabe que existe "google.maps".
 */
export class GoogleMapsAdapter {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.map = null;
    }

    async load() {
        try {
            this.logger.info("Iniciando carga dinámica de Google Maps con Loader...");
            
            const { Loader } = await import('@googlemaps/js-api-loader');
            const loader = new Loader({
                apiKey: this.config.apiKey,
                version: "weekly",
            });

            // Importación dinámica de librerías para mapa vectorial y marcadores
            const [{ Map }, { AdvancedMarkerElement, PinElement }] = await Promise.all([
                loader.importLibrary("maps"),
                loader.importLibrary("marker")
            ]);
            
            this.libraries = { Map, AdvancedMarkerElement, PinElement };
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

            this.logger.info(`Marcador agregado en Manhattan: ${location.lat}, ${location.lng}`);
            return marker;
        } catch (e) {
            this.logger.error("Error agregando marcador", e);
        }
    }
}
