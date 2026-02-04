/**
 * Registro de servicios disponibles en el backend.
 * Define la estructura de datos necesaria para renderizar formularios dinámicos.
 */
export const ServiceRegistry = [
    {
        id: 'enrichLocation',
        name: 'Enriquecer Ubicación (Coords)',
        method: 'enrichLocation',
        description: 'Obtiene información operativa basada en latitud y longitud.',
        params: [
            { name: 'latitude', label: 'Latitud', type: 'number', default: 40.7484, step: '0.0001' },
            { name: 'longitude', label: 'Longitud', type: 'number', default: -73.9857, step: '0.0001' },
            { name: 'generateMap', label: 'Generar Mapa Estático', type: 'boolean', default: false }
        ]
    },
    {
        id: 'geocode',
        name: 'Geocodificación (Dirección)',
        method: 'geocode',
        description: 'Busca coordenadas y datos de una dirección textual.',
        params: [
            { name: 'address', label: 'Dirección', type: 'text', default: 'Empire State Building', placeholder: 'Ej: Calle 100 # 15-20, Bogotá' }
        ]
    },
    {
        id: 'cleanPath',
        name: 'Corrección de Traza',
        method: 'cleanPath',
        description: 'Ajusta una serie de puntos a las vías existentes.',
        params: [
            { 
                name: 'pointsJson', 
                label: 'Puntos (JSON)', 
                type: 'json', 
                default: '[\n  {"lat": 6.2442, "lng": -75.5812, "timestamp": "2023-10-27T10:00:00Z"},\n  {"lat": 6.2445, "lng": -75.5815, "timestamp": "2023-10-27T10:00:10Z"}\n]' 
            }
        ]
    },
    {
        id: 'auditRoute',
        name: 'Auditoría de Ruta',
        method: 'auditRoute',
        description: 'Obtiene métricas y polilínea optimizada entre origen y destino.',
        params: [
            { 
                name: 'routeJson', 
                label: 'Configuración de Ruta (JSON)', 
                type: 'json', 
                default: '{\n  "origin": "Parque Berrio, Medellin",\n  "destination": "Terminal del Norte, Medellin",\n  "waypoints": ["Centro Comercial Premium Plaza"],\n  "generate_map": false\n}' 
            }
        ]
    }
];
