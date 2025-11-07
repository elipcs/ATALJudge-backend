/**
 * Middlewares Module Exports
 * 
 * Central export point for all middleware functions and utilities.
 * Includes authentication, validation, error handling, rate limiting, and payload conversion.
 * 
 * @module middlewares
 */
export { authenticate, requireRole, requireProfessor, requireTeacher, requireOwnResourceOrTeacher, AuthRequest } from './auth.middleware';
export { validateBody, validateQuery } from './validation.middleware';
export { errorHandler, notFoundHandler } from './error.middleware';
export { convertQuestionPayload, convertUserRegisterPayload } from './payload-converter.middleware';
export { authRateLimiter, registerRateLimiter, passwordResetRateLimiter, submissionRateLimiter } from './rate-limit.middleware';

