/**
 * Puerto que define la interfaz para interactuar con los servicios del backend.
 * Sigue el principio de Inversión de Dependencias.
 */
export class IApiService {
    /**
     * Realiza el login y retorna el token.
     */
    async login(username, password) {
        throw new Error("Método login() no implementado");
    }

    /**
     * Enriquece una ubicación con información operativa.
     */
    async enrichLocation(latitude, longitude, generateMap = false) {
        throw new Error("Método enrichLocation() no implementado");
    }

    /**
     * Geocoding: Dirección a Coordenadas.
     */
    async geocode(address) {
        throw new Error("Método geocode() no implementado");
    }

    /**
     * Corrección de Traza: Ajusta puntos a la vía.
     */
    async cleanPath(points, generateMap = false) {
        throw new Error("Método cleanPath() no implementado");
    }
}
