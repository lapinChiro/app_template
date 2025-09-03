import winston from 'winston';

/**
 * Creates a Winston logger instance with the specified service name
 * 
 * The logger is configured with:
 * - JSON format for structured logging
 * - Timestamp on each log entry
 * - Error stack trace capture
 * - Service name as metadata
 * - Console output with colors
 * - File outputs for all logs (combined.log) and errors only (error.log)
 * 
 * Log level can be controlled via LOG_LEVEL environment variable
 * 
 * @param service - The name of the service using the logger
 * @returns Configured Winston logger instance
 * 
 * @example
 * ```typescript
 * const logger = createLogger('AgentManager');
 * logger.info('Agent created', { agentId: 'agent-123' });
 * logger.error('Failed to create agent', { error: err, agentId: 'agent-456' });
 * ```
 */
export function createLogger(service: string): winston.Logger {
  return winston.createLogger({
    level: process.env['LOG_LEVEL'] ?? 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'service']
      })
    ),
    defaultMeta: { service },
    transports: [
      // Console transport with color and simple format for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      // File transport for error logs only
      new winston.transports.File({
        filename: 'error.log',
        level: 'error'
      }),
      // File transport for all logs
      new winston.transports.File({
        filename: 'combined.log'
      })
    ]
  });
}