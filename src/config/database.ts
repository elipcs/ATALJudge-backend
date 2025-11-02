import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './environment';
import { logger } from '../utils';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  url: config.database.url,

  synchronize: false,

  logging: config.nodeEnv === 'development' ? ['query', 'error'] : ['error'],

  entities: [__dirname + '/../models/**/*.{ts,js}'],

  migrations: [__dirname + '/../migrations/**/*.{ts,js}'],

  subscribers: [],

  extra: {
    max: 10, 
    min: 2,  
    idleTimeoutMillis: 30000, 
    connectionTimeoutMillis: 2000 
  },

  connectTimeoutMS: 5000,

  cache: {
    duration: 30000 
  }
});

export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    logger.info(`Conectado ao PostgreSQL: ${config.database.host}:${config.database.port}/${config.database.database}`);
  } catch (error) {
    logger.error('Erro ao conectar ao PostgreSQL', { error });
    throw error;
  }
}

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

export function isDatabaseConnected(): boolean {
  return AppDataSource.isInitialized;
}

