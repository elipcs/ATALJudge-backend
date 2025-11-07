/**
 * @module __tests__/setup
 * @description Jest setup file - runs before all tests
 * Configures global test utilities and environment
 */

// Required for TSyringe DI container
import 'reflect-metadata';

// Mock the logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    printf: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Mock TypeORM database
jest.mock('../config/database', () => ({
  AppDataSource: {
    initialize: jest.fn().mockResolvedValue(true),
    getRepository: jest.fn(() => ({
      find: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      query: jest.fn(),
    })),
    query: jest.fn(),
    createQueryBuilder: jest.fn(),
    isInitialized: true,
  },
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_EXPIRATION = '1h';
process.env.REFRESH_TOKEN_EXPIRATION = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/ataljudge_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JUDGE0_API_URL = 'https://judge0-api.test.com';
process.env.JUDGE0_API_KEY = 'test-key';
process.env.RAPIDAPI_HOST = 'judge0-ce.p.rapidapi.com';
process.env.RAPIDAPI_KEY = 'test-key';

// Suppress console output during tests
const originalConsole = global.console;

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);

// Extend default expect timeout
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Clean up after all tests
afterAll(() => {
  global.console = originalConsole;
});

