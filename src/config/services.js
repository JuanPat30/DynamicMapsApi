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
    }
];
