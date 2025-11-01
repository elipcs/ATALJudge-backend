import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Configurações da aplicação
 */
export const config = {
  // Servidor
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  // Banco de dados
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'ataljudge',
    url: process.env.DATABASE_URL
  },
  
  // Segurança
  secretKey: process.env.SECRET_KEY || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRÍTICO: SECRET_KEY não definido em produção!');
    }
    return 'dev-secret-key-not-for-production';
  })(),
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CRÍTICO: JWT_SECRET não definido em produção!');
      }
      return 'dev-jwt-secret-not-for-production';
    })(),
    accessExpires: parseInt(process.env.JWT_ACCESS_EXPIRES || '3600', 10), // 1 hora
    refreshExpires: parseInt(process.env.JWT_REFRESH_EXPIRES || '2592000', 10) // 30 dias
  },
  
  // Email
  email: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM || 'noreply@ataljudge.com'
  },
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [],
  
  // Judge0
  judge0: {
    url: process.env.JUDGE0_URL || 'http://localhost:2358',
    apiKey: process.env.JUDGE0_API_KEY,
    rapidApiKey: process.env.JUDGE0_RAPID_API_KEY
  },
  
  // Codeforces
  codeforces: {
    apiUrl: process.env.CODEFORCES_API_URL || 'https://codeforces.com/api'
  },
  
  // Limites
  limits: {
    maxCodeSizeKB: parseInt(process.env.MAX_CODE_SIZE_KB || '200', 10),
    maxInputSizeKB: parseInt(process.env.MAX_INPUT_SIZE_KB || '64', 10),
    maxOutputSizeKB: parseInt(process.env.MAX_OUTPUT_SIZE_KB || '64', 10),
    maxTestCasesPerQuestion: parseInt(process.env.MAX_TEST_CASES_PER_QUESTION || '200', 10),
    defaultCpuTimeLimit: parseFloat(process.env.DEFAULT_CPU_TIME_LIMIT || '2.0'),
    defaultWallTimeLimit: parseFloat(process.env.DEFAULT_WALL_TIME_LIMIT || '5.0'),
    defaultMemoryLimitKB: parseInt(process.env.DEFAULT_MEMORY_LIMIT_KB || '262144', 10),
    maxSubmissionsPerMinute: parseInt(process.env.MAX_SUBMISSIONS_PER_MINUTE || '5', 10)
  }
};

/**
 * Valida as configurações obrigatórias
 */
export function validateConfig(): void {
  const errors: string[] = [];
  
  // Validar banco de dados
  if (!config.database.url && !config.database.database) {
    errors.push('DATABASE_URL ou DB_DATABASE deve estar configurado');
  }
  
  // Validar chaves de segurança (OBRIGATÓRIO em produção)
  if (config.nodeEnv === 'production') {
    if (!process.env.SECRET_KEY) {
      errors.push('CRÍTICO: SECRET_KEY não definido em produção!');
    }
    if (!process.env.JWT_SECRET) {
      errors.push('CRÍTICO: JWT_SECRET não definido em produção!');
    }
    if (config.secretKey.includes('dev-') || config.secretKey.includes('default')) {
      errors.push('CRÍTICO: SECRET_KEY contém valor de desenvolvimento!');
    }
    if (config.jwt.secret.includes('dev-') || config.jwt.secret.includes('default')) {
      errors.push('CRÍTICO: JWT_SECRET contém valor de desenvolvimento!');
    }
    // Validar comprimento mínimo dos secrets
    if (config.secretKey.length < 32) {
      errors.push('CRÍTICO: SECRET_KEY deve ter pelo menos 32 caracteres!');
    }
    if (config.jwt.secret.length < 32) {
      errors.push('CRÍTICO: JWT_SECRET deve ter pelo menos 32 caracteres!');
    }
  } else {
    // Avisos para desenvolvimento
    if (!process.env.SECRET_KEY) {
      console.warn('AVISO: SECRET_KEY não definido, usando valor de desenvolvimento');
    }
    if (!process.env.JWT_SECRET) {
      console.warn('AVISO: JWT_SECRET não definido, usando valor de desenvolvimento');
    }
  }
  
  // Validar Judge0
  if (!config.judge0.url) {
    errors.push('JUDGE0_URL não configurado');
  }
  
  if (errors.length > 0) {
    throw new Error(`Erros de configuração:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

/**
 * Verifica se está em modo de desenvolvimento
 */
export function isDevelopment(): boolean {
  return config.nodeEnv === 'development';
}

/**
 * Verifica se está em modo de produção
 */
export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}

/**
 * Verifica se está em modo de teste
 */
export function isTest(): boolean {
  return config.nodeEnv === 'test';
}

