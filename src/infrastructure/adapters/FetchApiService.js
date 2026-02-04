import { IApiService } from '../../core/ports/IApiService.js';

/**
 * Adaptador de infraestructura que implementa IApiService usando Fetch API.
 * Mantiene el principio de Zero Hardcoding usando el objeto de configuración inyectado.
 */
export class FetchApiService extends IApiService {
    constructor(config, logger) {
        super();
        this.config = config.backend;
        this.logger = logger;
        this.token = null;
    }

    async _request(endpoint, options = {}) {
        const url = `${this.config.baseUrl}${this.config.apiV1Path}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            this.logger.info(`Request a: ${url}`);
            const response = await fetch(url, { 
                ...options, 
                headers,
                credentials: 'include' // Permitir envío de cookies y headers auth cross-origin
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error en la petición: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error(`Fallo en la comunicación con el backend en ${endpoint}`, error);
            throw error;
        }
    }

    async login(username, password) {
        this.logger.info(`Iniciando autenticación con usuario: ${username}`);
        
        // Generar credenciales Basic Auth para evitar el popup del navegador (ERR_401 Challenge)
        const credentials = btoa(`${username}:${password}`);
        
        const data = await this._request('/login', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            },
            body: JSON.stringify({ username, password })
        });

        if (data.token) {
            this.token = data.token;
            this.logger.info("Autenticación exitosa. Token recibido.");
            return data.token;
        }
        
        throw new Error("Respuesta de login inválida: Token no encontrado");
    }

    async enrichLocation(latitude, longitude, generateMap = this.config.generateMap) {
        return await this._request('/enrich-location', {
            method: 'POST',
            body: JSON.stringify({ latitude, longitude, generate_map: generateMap })
        });
    }

    async geocode(address) {
        return await this._request('/enrich-location', {
            method: 'POST',
            body: JSON.stringify({ address })
        });
    }

    async cleanPath(points, generateMap = false) {
        return await this._request('/clean-path', {
            method: 'POST',
            body: JSON.stringify({ points, generate_map: generateMap })
        });
    }

    async auditRoute(data) {
        return await this._request('/audit-route', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async searchPlaces(data) {
        return await this._request('/places/text-search', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}
