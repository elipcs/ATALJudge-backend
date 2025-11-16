/**
 * TypeORM CLI Data Source Configuration
 * 
 * This file is specifically for TypeORM CLI commands (migrations, etc.)
 * It must export only the DataSource instance as default.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'postgres',

  synchronize: false,

  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],

  // Don't load entities for migrations - migrations create the schema
  entities: [],

  migrations: [__dirname + '/../migrations/**/*.{ts,js}'],

  subscribers: [],

  extra: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // Only use SSL if explicitly enabled via environment variable
    ...(process.env.DB_SSL === 'true' ? {
      ssl: {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      }
    } : {})
  },

  connectTimeoutMS: 10000,

  cache: {
    duration: 30000
  }
});
