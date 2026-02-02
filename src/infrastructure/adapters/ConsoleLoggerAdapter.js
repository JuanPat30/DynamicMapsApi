import { ILogger } from '../../core/ports/ILogger.js';

export class ConsoleLoggerAdapter extends ILogger {
    constructor(env) {
        super();
        this.env = env;
    }

    info(message, context = {}) {
        console.info(`[INFO] ${new Date().toISOString()} - ${message}`, context);
    }

    error(message, error) {
        // En producción, aquí conectarías con Sentry o Datadog
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
            message: error.message,
            stack: error.stack,
            ...error
        });
    }

    warn(message, context = {}) {
        console.warn(`[WARN] ${message}`, context);
    }
}