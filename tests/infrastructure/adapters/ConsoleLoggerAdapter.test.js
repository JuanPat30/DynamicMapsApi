import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsoleLoggerAdapter } from '../../../src/infrastructure/adapters/ConsoleLoggerAdapter.js';

describe('ConsoleLoggerAdapter', () => {
    let logger;
    const mockEnv = { VITE_APP_ENV: 'development' };

    beforeEach(() => {
        logger = new ConsoleLoggerAdapter(mockEnv);
        // Limpiar mocks de console
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('should log info messages correctly', () => {
        const message = 'Test info message';
        const context = { user: 'test' };
        
        logger.info(message, context);

        expect(console.info).toHaveBeenCalledWith(
            expect.stringContaining(`[INFO]`),
            context
        );
        expect(console.info).toHaveBeenCalledWith(
            expect.stringContaining(message),
            context
        );
    });

    it('should log warning messages correctly', () => {
        const message = 'Test warn message';
        const context = { detail: 'something' };

        logger.warn(message, context);

        expect(console.warn).toHaveBeenCalledWith(`[WARN] ${message}`, context);
    });

    it('should log error messages correctly', () => {
        const message = 'Test error message';
        const error = new Error('Original error');
        
        logger.error(message, error);

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(`[ERROR]`),
            expect.objectContaining({
                message: error.message,
                stack: error.stack
            })
        );
    });
});
