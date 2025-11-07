import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'ataljudge',
    url: process.env.DATABASE_URL
  },

  secretKey: process.env.SECRET_KEY || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRÍTICO: SECRET_KEY não definido em produção!');
    }
    return 'dev-secret-key-not-for-production';
  })(),

  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CRÍTICO: JWT_SECRET não definido em produção!');
      }
      return 'dev-jwt-secret-not-for-production';
    })(),
    accessExpires: parseInt(process.env.JWT_ACCESS_EXPIRES || '3600', 10), 
    refreshExpires: parseInt(process.env.JWT_REFRESH_EXPIRES || '2592000', 10) 
  },

  email: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM || 'noreply@ataljudge.com'
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  allowedOrigins: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [],

  judge0: {
    url: process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com',
    apiKey: process.env.JUDGE0_API_KEY,
    rapidApiKey: process.env.JUDGE0_RAPID_API_KEY
  },

  codeforces: {
    apiUrl: process.env.CODEFORCES_API_URL || 'https://codeforces.com/api'
  },

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

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.database.url && !config.database.database) {
    errors.push('DATABASE_URL or DB_DATABASE must be configured');
  }

  if (config.nodeEnv === 'production') {
    if (!process.env.SECRET_KEY) {
      errors.push('CRITICAL: SECRET_KEY not defined in production!');
    }
    if (!process.env.JWT_SECRET) {
      errors.push('CRITICAL: JWT_SECRET not defined in production!');
    }
    if (config.secretKey.includes('dev-') || config.secretKey.includes('default')) {
      errors.push('CRITICAL: SECRET_KEY contains development value!');
    }
    if (config.jwt.secret.includes('dev-') || config.jwt.secret.includes('default')) {
      errors.push('CRITICAL: JWT_SECRET contains development value!');
    }
    
    if (config.secretKey.length < 32) {
      errors.push('CRITICAL: SECRET_KEY must be at least 32 characters!');
    }
    if (config.jwt.secret.length < 32) {
      errors.push('CRITICAL: JWT_SECRET must be at least 32 characters!');
    }
  } else {
    
    if (!process.env.SECRET_KEY) {
      console.warn('WARNING: SECRET_KEY not defined, using development value');
    }
    if (!process.env.JWT_SECRET) {
      console.warn('WARNING: JWT_SECRET not defined, using development value');
    }
  }

  if (!config.judge0.url) {
    errors.push('JUDGE0_URL not configured');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

export function isDevelopment(): boolean {
  return config.nodeEnv === 'development';
}

export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}

export function isTest(): boolean {
  return config.nodeEnv === 'test';
}

