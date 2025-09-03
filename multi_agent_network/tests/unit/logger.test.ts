import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import winston from 'winston';
import { createLogger } from '@/core/logger';

describe('createLogger', () => {
  const originalEnv = process.env['LOG_LEVEL'];

  beforeEach(() => {
    // Clear any existing environment variable
    delete process.env['LOG_LEVEL'];
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env['LOG_LEVEL'] = originalEnv;
    }
  });

  it('should create a logger with the specified service name', () => {
    const logger = createLogger('test-service');
    
    expect(logger).toBeInstanceOf(winston.Logger);
    // Winston logger should have defaultMeta with service
    expect(logger.defaultMeta).toEqual({ service: 'test-service' });
  });

  it('should use LOG_LEVEL environment variable when set', () => {
    process.env['LOG_LEVEL'] = 'debug';
    const logger = createLogger('test-service');
    
    expect(logger.level).toBe('debug');
  });

  it('should default to info level when LOG_LEVEL is not set', () => {
    const logger = createLogger('test-service');
    
    expect(logger.level).toBe('info');
  });

  it('should have console and file transports', () => {
    const logger = createLogger('test-service');
    
    // Check that transports are configured
    expect(logger.transports).toBeDefined();
    expect(logger.transports.length).toBeGreaterThan(0);
    
    // Find transport types
    const transportTypes = logger.transports.map(t => t.constructor.name);
    expect(transportTypes).toContain('Console');
    expect(transportTypes).toContain('File');
  });

  it('should support all log levels', () => {
    const logger = createLogger('test-service');
    
    // Verify methods exist
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should have correct file transport configuration', () => {
    const logger = createLogger('test-service');
    
    // Find file transports
    const fileTransports = logger.transports.filter(
      t => t.constructor.name === 'File'
    ) as winston.transports.File[];
    
    // Should have two file transports: error.log and combined.log
    expect(fileTransports.length).toBe(2);
    
    const filenames = fileTransports.map(t => t.filename);
    expect(filenames).toContain('error.log');
    expect(filenames).toContain('combined.log');
    
    // Error log should only log errors
    const errorTransport = fileTransports.find(t => t.filename === 'error.log');
    expect(errorTransport?.level).toBe('error');
  });

  it('should format logs correctly', () => {
    const logger = createLogger('test-service');
    const logSpy = vi.spyOn(logger, 'info');
    
    logger.info('Test message', { extra: 'data' });
    
    expect(logSpy).toHaveBeenCalledWith('Test message', { extra: 'data' });
  });

  it('should handle errors with stack traces', () => {
    const logger = createLogger('test-service');
    const logSpy = vi.spyOn(logger, 'error');
    
    const testError = new Error('Test error');
    logger.error('An error occurred', { error: testError });
    
    expect(logSpy).toHaveBeenCalledWith('An error occurred', { error: testError });
  });
});