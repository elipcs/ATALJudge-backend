/**
 * Logger Module
 * 
 * Configures Winston logger for the application with environment-specific formatting.
 * Provides structured logging with different levels, colors in development, and file persistence in production.
 * Logs are output to console and to files (combined.log and error.log) in production.
 * 
 * @module utils/logger
 */

import winston from 'winston';
import { config } from '../config/environment';

/**
 * Log Levels
 * 
 * Defines logging levels with their numeric severity (lower = more severe).
 * Error: system is unusable, Warn: warning condition, Info: informational,
 * Http: HTTP request/response logging, Debug: debug-level messages.
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Log Level Colors
 * 
 * Associates colors with log levels for console output in development.
 * Makes logs easier to scan visually.
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

/**
 * Development Format
 * 
 * Colorized, human-readable format with timestamps and metadata for development environment.
 * Includes all extra information in pretty-printed JSON format.
 */
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    let message = `${info.timestamp} [${info.level}]: ${info.message}`;

    const meta: any = { ...info };
    delete meta.timestamp;
    delete meta.level;
    delete meta.message;
    
    if (Object.keys(meta).length > 0) {
      message += ' ' + JSON.stringify(meta, null, 2);
    }
    
    return message;
  })
);

/**
 * Production Format
 * 
 * JSON format for production with timestamps and stack traces.
 * Suitable for log aggregation and automated parsing.
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Logger Transports
 * 
 * Defines where logs are sent:
 * - Console: Always enabled for realtime monitoring
 * - combined.log: All logs in production
 * - error.log: Error-level logs only in production
 */
const transports: winston.transport[] = [
  
  new winston.transports.Console(),
];

if (config.nodeEnv === 'production') {
  
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, 
      maxFiles: 5,
    })
  );

  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, 
      maxFiles: 5,
    })
  );
}

/**
 * Logger Instance
 * 
 * Main logger instance configured with appropriate format and transports.
 * Log level is 'debug' in development and 'info' in production.
 * 
 * @example
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Database connection failed', { error: err });
 */
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  levels,
  format: config.nodeEnv === 'production' ? prodFormat : devFormat,
  transports,
  
  exitOnError: false,
});

export default logger;

