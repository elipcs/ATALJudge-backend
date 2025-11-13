/**
 * Utilities Module
 * 
 * Exports utility functions and classes for:
 * - Token management (JWT generation and verification)
 * - DTO validation with custom validators
 * - API response formatting (success and error responses)
 * - Application logging with Winston
 * - Custom error classes with proper HTTP status codes
 * - Data sanitization to prevent sensitive info leaks
 * - Async handler wrapper for Express route handlers
 * 
 * @module utils
 */

export { TokenManager, JwtPayload } from './TokenManager';
export { validateDto, ValidationException, IsStrongPassword, IsValidEmail, IsValidScore, IsValidStudentRegistration } from './validators';
export { successResponse, errorResponse, validationErrorResponse, ApiResponse } from './responses';
export { default as logger } from './logger';
export {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BusinessRuleError,
  RateLimitError,
  InternalServerError,
  TokenError,
  isOperationalError
} from './errors';
export { sanitizeForLog, sanitizeUserForLog, sanitizeHeaders } from './sanitize';
export { asyncHandler } from './asyncHandler';
export { ConstraintParser, ParsedConstraints, VariableConstraint } from './ConstraintParser';

