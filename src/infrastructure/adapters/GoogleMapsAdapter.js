/**
 * Adaptador que encapsula TODA la lógica de Google Maps.
 * El resto de la app no sabe que existe "google.maps".
 */
export class GoogleMapsAdapter {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.map = null;
        this.google = null; // Referencia al namespace global
    }

    async load() {
        try {
            this.logger.info("Iniciando carga dinámica de Google Maps con Loader...");
            
            const { Loader } = await import('@googlemaps/js-api-loader');
            const loader = new Loader({
                apiKey: this.config.apiKey,
                version: "weekly",
            });

            // Importación dinámica de librerías
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
                zoom: 18,
                mapId: this.config.mapId, // Necesario para Advanced Markers y Vector Map
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.TOP_LEFT,
                },
                // Funcionalidades de Mapa Vectorial
                tilt: 45,
                heading: 0,
                rotateControl: true,
                tiltControl: true,
            });

            this.logger.info("Mapa vectorial renderizado con soporte para inclinación y rotación.");
            return this.map;
        } catch (e) {
            this.logger.error("Error al inicializar el mapa", e);
            throw e;
        }
    }

    setDarkMode(enabled) {
        if (!this.map) return;

        const darkStyle = [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }],
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }],
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }],
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }],
            },
        ];

        this.map.setOptions({
            styles: enabled ? darkStyle : [],
        });
        
        this.logger.info(`Modo oscuro ${enabled ? 'activado' : 'desactivado'} en el mapa.`);
    }

    addMarker(location, title) {
        try {
            const { AdvancedMarkerElement, PinElement } = this.libraries;
            
            // Personalización (Ejemplo de estilo)
            const pin = new PinElement({
                background: "#FBBC04",
                glyphColor: "#137333",
                borderColor: "#137333",
            });

            const marker = new AdvancedMarkerElement({
                map: this.map,
                position: location,
                title: title,
                content: pin.element
            });

            this.logger.info(`Marcador agregado en: ${location.lat}, ${location.lng}`);
            return marker;
        } catch (e) {
            this.logger.error("Error agregando marcador", e);
        }
    }
}