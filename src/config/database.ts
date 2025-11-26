/**
 * Database Configuration and Connection Module
 * 
 * Manages TypeORM data source initialization and lifecycle.
 * Provides connection pooling, logging, and error handling for PostgreSQL.
 * 
 * @module config/database
 * @see {@link https://typeorm.io/ TypeORM documentation}
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './environment';
import { logger } from '../utils';

/**
 * TypeORM Data Source Configuration
 * 
 * Configured with:
 * - PostgreSQL database engine
 * - Connection pooling (min: 2, max: 10 connections)
 * - Entity and migration auto-discovery
 * - Query logging in development mode
 */
// Detect if using local database (judge0-db, localhost) or external (AWS RDS)
const isLocalDatabase = config.database.host === 'judge0-db' ||
  config.database.host === 'localhost' ||
  config.database.host === '127.0.0.1';

// Only enable SSL for external databases (AWS RDS)
const shouldUseSSL = config.nodeEnv === 'production' && !isLocalDatabase;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  url: config.database.url,

  // Enable SSL only for external databases (AWS RDS)
  ssl: shouldUseSSL ? {
    rejectUnauthorized: false // AWS RDS uses self-signed certificates
  } : false,

  synchronize: false,

  logging: config.nodeEnv === 'development' ? ['query', 'error'] : ['error'],

  entities: [__dirname + '/../models/**/*.{ts,js}'],

  migrations: [__dirname + '/../migrations/**/*.{ts,js}'],

  subscribers: [],

  extra: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // SSL configuration for connection pool
    ssl: shouldUseSSL ? {
      rejectUnauthorized: false
    } : undefined
  },

  connectTimeoutMS: 5000,

  cache: {
    duration: 30000
  }
});


/**
 * Initializes the database connection
 * 
 * Establishes connection to PostgreSQL and runs migrations if needed.
 * Logs connection details on success or throws error on failure.
 * 
 * @returns {Promise<void>}
 * @throws {Error} If database connection fails
 */
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info(`Tentando conectar ao PostgreSQL...`);
    logger.info(`Host: ${config.database.host}`);
    logger.info(`Port: ${config.database.port}`);
    logger.info(`Database: ${config.database.database}`);
    logger.info(`Username: ${config.database.username}`);
    logger.info(`URL presente: ${config.database.url ? 'Sim' : 'Não'}`);

    await AppDataSource.initialize();
    logger.info(`Conectado ao PostgreSQL: ${config.database.host}:${config.database.port}/${config.database.database}`);
  } catch (error: any) {
    logger.error('Erro ao conectar ao PostgreSQL', {
      error,
      message: error?.message,
      code: error?.code,
      detail: error?.detail
    });
    throw error;
  }
}

/**
 * Closes the database connection gracefully
 * 
 * Destroys the TypeORM data source connection.
 * Logs the disconnection or any errors that occur.
 * 
 * @returns {Promise<void>}
 * @throws {Error} If disconnection fails
 */
export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Conexão com PostgreSQL encerrada');
    }
  } catch (error) {
    logger.error('Erro ao fechar conexão com PostgreSQL', { error });
    throw error;
  }
}

/**
 * Checks if database connection is active
 * 
 * @returns {boolean} True if connected, false otherwise
 */
export function isDatabaseConnected(): boolean {
  return AppDataSource.isInitialized;
}

// Export default for TypeORM CLI
export default AppDataSource;

