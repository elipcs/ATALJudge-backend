/**
 * Data Sanitization Module
 * 
 * Provides functions to redact sensitive information from objects before logging.
 * Prevents accidental exposure of passwords, tokens, and other confidential data in logs.
 * Recursively processes nested objects and arrays.
 * 
 * @module utils/sanitize
 */

/**
 * Sensitive Fields
 * 
 * List of field names that should be redacted from logs.
 * Matching is case-insensitive and includes partial matches.
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'newPassword',
  'currentPassword',
  'confirmPassword',
  'token',
  'refreshToken',
  'accessToken',
  'resetToken',
  'secret',
  'apiKey',
  'privateKey',
  'creditCard',
  'cvv',
  'ssn'
];

/**
 * Sanitize For Log
 * 
 * Recursively redacts sensitive fields from any object structure.
 * Returns a new object with sensitive values replaced with [REDACTED].
 * Handles nested objects and arrays properly.
 * 
 * @param {any} obj - Object to sanitize
 * @param {string} [replacement='[REDACTED]'] - Replacement text for sensitive fields
 * @returns {any} Sanitized object with sensitive fields redacted
 * 
 * @example
 * const userData = { email: 'user@example.com', password: 'secret123' };
 * const safe = sanitizeForLog(userData);
 * // Returns: { email: 'user@example.com', password: '[REDACTED]' }
 * 
 * @example
 * const users = [
 *   { email: 'user1@example.com', token: 'abc123' },
 *   { email: 'user2@example.com', token: 'xyz789' }
 * ];
 * const safe = sanitizeForLog(users);
 * // All tokens are redacted
 */
export function sanitizeForLog(obj: any, replacement: string = '[REDACTED]'): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLog(item, replacement));
  }

  const sanitized: any = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();

      const isSensitive = SENSITIVE_FIELDS.some(field => 
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = replacement;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        
        sanitized[key] = sanitizeForLog(obj[key], replacement);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }

  return sanitized;
}

/**
 * Sanitize User For Log
 * 
 * Removes password and passwordHash fields from user object for logging.
 * Returns a new object without these sensitive fields.
 * 
 * @param {any} user - User object to sanitize
 * @returns {any} User object without password/passwordHash
 * 
 * @example
 * const user = await userRepository.findOne(userId);
 * logger.info('User data:', sanitizeUserForLog(user));
 * // Password fields will not be included in logs
 */
export function sanitizeUserForLog(user: any): any {
  if (!user) return user;
  
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Sanitize Headers
 * 
 * Redacts authorization headers and cookies from request headers before logging.
 * Prevents exposure of authentication tokens in logs.
 * 
 * @param {any} headers - Request headers object to sanitize
 * @returns {any} Headers object with sensitive values redacted
 * 
 * @example
 * const req = request;
 * logger.info('Request:', { headers: sanitizeHeaders(req.headers) });
 * // Authorization and cookie headers will be redacted
 */
export function sanitizeHeaders(headers: any): any {
  if (!headers) return headers;

  const sanitized = { ...headers };
  
  if (sanitized.authorization) {
    sanitized.authorization = '[REDACTED]';
  }
  
  if (sanitized.cookie) {
    sanitized.cookie = '[REDACTED]';
  }

  return sanitized;
}

