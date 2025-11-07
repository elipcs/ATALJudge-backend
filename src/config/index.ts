/**
 * Configuration Module Exports
 * 
 * Central export point for all configuration modules including:
 * - Environment configuration
 * - Database initialization and management
 * - Dependency injection container setup
 * 
 * @module config
 */
export { config, validateConfig, isDevelopment, isProduction, isTest } from './environment';
export { AppDataSource, initializeDatabase, closeDatabase, isDatabaseConnected } from './database';
export { container, setupContainer } from './container';

