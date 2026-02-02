// Interfaz abstracta para logging (Duck typing en JS)
export class ILogger {
    info(message, context) {}
    error(message, error) {}
    warn(message, context) {}
}