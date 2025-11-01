import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './environment';
import { logger } from '../utils';

/**
 * Configuração do TypeORM DataSource
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  url: config.database.url,
  
  // Sincronização automática DESABILITADA - use migrations!
  // NUNCA habilite isso em produção - pode causar perda de dados
  synchronize: false,
  
  // Logging
  logging: config.nodeEnv === 'development' ? ['query', 'error'] : ['error'],
  
  // Entidades
  entities: [__dirname + '/../models/**/*.{ts,js}'],
  
  // Migrações
  migrations: [__dirname + '/../migrations/**/*.{ts,js}'],
  
  // Subscribers
  subscribers: [],
  
  // Pool de conexões
  extra: {
    max: 10, // Número máximo de conexões
    min: 2,  // Número mínimo de conexões
    idleTimeoutMillis: 30000, // Timeout de conexões inativas
    connectionTimeoutMillis: 2000 // Timeout de aquisição de conexão
  },
  
  // Configurações do PostgreSQL
  connectTimeoutMS: 5000,
  
  // Opções de cache
  cache: {
    duration: 30000 // Cache de 30 segundos
  }
});

/**
 * Inicializa a conexão com o banco de dados
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    logger.info(`Conectado ao PostgreSQL: ${config.database.host}:${config.database.port}/${config.database.database}`);
  } catch (error) {
    logger.error('Erro ao conectar ao PostgreSQL', { error });
    throw error;
  }
}

/**
 * Fecha a conexão com o banco de dados
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
 * Verifica se a conexão com o banco está ativa
 */
export function isDatabaseConnected(): boolean {
  return AppDataSource.isInitialized;
}

