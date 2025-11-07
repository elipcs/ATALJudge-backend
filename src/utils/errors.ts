/**
 * Custom Error Classes Module
 * 
 * Defines application-specific error classes extending base Error.
 * All errors include HTTP status code and error code for proper API responses.
 * Supports operational errors that can be safely sent to clients.
 * 
 * @module utils/errors
 */

/**
 * App Error Base Class
 * 
 * Base class for all application errors.
 * Includes HTTP status code and error code for API responses.
 * Marked as operational to distinguish from programming errors.
 * 
 * @class AppError
 * @extends Error
 * @property {number} statusCode - HTTP status code for the response
 * @property {string} errorCode - Error identifier code
 * @property {boolean} isOperational - Always true, indicates safe error for client
 * 
 * @example
 * throw new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  /**
   * Create App Error
   * 
   * @param {string} message - Error message for the user
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [errorCode='INTERNAL_ERROR'] - Error code identifier
   */
  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
  }
}

/**
 * Not Found Error
 * 
 * Thrown when a requested resource does not exist (404).
 * 
 * @class NotFoundError
 * @extends AppError
 * 
 * @example
 * throw new NotFoundError('User not found');
 */
export class NotFoundError extends AppError {
  /**
   * Create Not Found Error
   * 
   * @param {string} [message='Resource not found'] - Error message
   * @param {string} [errorCode='NOT_FOUND'] - Error code
   */
  constructor(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

/**
 * Validation Error
 * 
 * Thrown when DTO validation fails (400).
 * Can include field-specific validation error messages.
 * 
 * @class ValidationError
 * @extends AppError
 * @property {Record<string, string[]>} [errors] - Field validation errors
 * 
 * @example
 * throw new ValidationError(
 *   'Invalid request data',
 *   'VALIDATION_ERROR',
 *   { email: ['Invalid email format'] }
 * );
 */
export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;

  /**
   * Create Validation Error
   * 
   * @param {string} [message='Invalid data'] - Error message
   * @param {string} [errorCode='VALIDATION_ERROR'] - Error code
   * @param {Record<string, string[]>} [errors] - Field-specific errors
   */
  constructor(
    message: string = 'Invalid data',
    errorCode: string = 'VALIDATION_ERROR',
    errors?: Record<string, string[]>
  ) {
    super(message, 400, errorCode);
    this.errors = errors;
  }
}

/**
 * Unauthorized Error
 * 
 * Thrown when user is not authenticated (401).
 * 
 * @class UnauthorizedError
 * @extends AppError
 * 
 * @example
 * throw new UnauthorizedError('Missing authentication token');
 */
export class UnauthorizedError extends AppError {
  /**
   * Create Unauthorized Error
   * 
   * @param {string} [message='Not authenticated'] - Error message
   * @param {string} [errorCode='UNAUTHORIZED'] - Error code
   */
  constructor(message: string = 'Not authenticated', errorCode: string = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

/**
 * Forbidden Error
 * 
 * Thrown when user lacks permission to access resource (403).
 * User is authenticated but not authorized for this operation.
 * 
 * @class ForbiddenError
 * @extends AppError
 * 
 * @example
 * throw new ForbiddenError('You cannot access this resource');
 */
export class ForbiddenError extends AppError {
  /**
   * Create Forbidden Error
   * 
   * @param {string} [message='Permission denied to access this resource'] - Error message
   * @param {string} [errorCode='FORBIDDEN'] - Error code
   */
  constructor(message: string = 'Permission denied to access this resource', errorCode: string = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

/**
 * Conflict Error
 * 
 * Thrown when request conflicts with current state (409).
 * Usually for duplicate resources or state conflicts.
 * 
 * @class ConflictError
 * @extends AppError
 * 
 * @example
 * throw new ConflictError('Email already registered');
 */
export class ConflictError extends AppError {
  /**
   * Create Conflict Error
   * 
   * @param {string} [message='Data conflict'] - Error message
   * @param {string} [errorCode='CONFLICT'] - Error code
   */
  constructor(message: string = 'Data conflict', errorCode: string = 'CONFLICT') {
    super(message, 409, errorCode);
  }
}

/**
 * Business Rule Error
 * 
 * Thrown when business logic validation fails (422).
 * Data may be valid but violates business rules.
 * 
 * @class BusinessRuleError
 * @extends AppError
 * 
 * @example
 * throw new BusinessRuleError('Grade must be greater than 0');
 */
export class BusinessRuleError extends AppError {
  /**
   * Create Business Rule Error
   * 
   * @param {string} message - Error message describing business rule violation
   * @param {string} [errorCode='BUSINESS_RULE_ERROR'] - Error code
   */
  constructor(message: string, errorCode: string = 'BUSINESS_RULE_ERROR') {
    super(message, 422, errorCode);
  }
}

/**
 * Rate Limit Error
 * 
 * Thrown when rate limit is exceeded (429).
 * Client has made too many requests.
 * 
 * @class RateLimitError
 * @extends AppError
 * 
 * @example
 * throw new RateLimitError('Too many login attempts');
 */
export class RateLimitError extends AppError {
  /**
   * Create Rate Limit Error
   * 
   * @param {string} [message='Too many requests, try again later'] - Error message
   * @param {string} [errorCode='RATE_LIMIT'] - Error code
   */
  constructor(message: string = 'Too many requests, try again later', errorCode: string = 'RATE_LIMIT') {
    super(message, 429, errorCode);
  }
}

/**
 * Internal Server Error
 * 
 * Thrown for unexpected server errors (500).
 * Should not expose internal error details to client.
 * 
 * @class InternalServerError
 * @extends AppError
 * 
 * @example
 * throw new InternalServerError('Database connection failed');
 */
export class InternalServerError extends AppError {
  /**
   * Create Internal Server Error
   * 
   * @param {string} [message='Internal server error'] - Error message
   * @param {string} [errorCode='INTERNAL_ERROR'] - Error code
   */
  constructor(message: string = 'Internal server error', errorCode: string = 'INTERNAL_ERROR') {
    super(message, 500, errorCode);
  }
}

/**
 * Token Error
 * 
 * Thrown when token validation or verification fails (401).
 * Extends UnauthorizedError for token-specific issues.
 * 
 * @class TokenError
 * @extends UnauthorizedError
 * 
 * @example
 * throw new TokenError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
 */
export class TokenError extends UnauthorizedError {
  /**
   * Create Token Error
   * 
   * @param {string} message - Error message about token issue
   * @param {string} [errorCode='TOKEN_ERROR'] - Error code
   */
  constructor(message: string, errorCode: string = 'TOKEN_ERROR') {
    super(message, errorCode);
  }
}

/**
 * Is Operational Error
 * 
 * Checks if an error is an AppError marked as operational.
 * Operational errors are safe to send to clients.
 * Non-operational errors indicate programming bugs.
 * 
 * @function isOperationalError
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is an operational AppError
 * 
 * @example
 * try {
 *   // Some operation
 * } catch (error) {
 *   if (isOperationalError(error)) {
 *     res.status(error.statusCode).json({ message: error.message });
 *   } else {
 *     // Log and handle unexpected error
 *     logger.error('Unexpected error:', error);
 *     res.status(500).json({ message: 'Internal server error' });
 *   }
 * }
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

