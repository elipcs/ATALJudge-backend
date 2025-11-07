/**
 * API Responses Module
 * 
 * Provides standardized response formatting functions for API endpoints.
 * Ensures consistent response structure across the application with proper status codes,
 * messages, and error formatting.
 * 
 * @module utils/responses
 */

import { Response } from 'express';

/**
 * API Response Interface
 * 
 * Standard response structure returned by all API endpoints.
 * Ensures consistent client-side response handling.
 * 
 * @interface ApiResponse
 * @template T - Type of data payload
 * @property {boolean} success - Indicates if request was successful
 * @property {string} [message] - Human-readable status message
 * @property {T} [data] - Response payload (for success responses)
 * @property {string} [error] - Error code (for error responses)
 * @property {Record<string, string[]>} [errors] - Validation errors by field (for validation errors)
 * 
 * @example
 * // Success response
 * {
 *   success: true,
 *   message: 'User created',
 *   data: { id: '123', email: 'user@example.com' }
 * }
 * 
 * // Error response
 * {
 *   success: false,
 *   message: 'Invalid request',
 *   error: 'VALIDATION_ERROR',
 *   errors: { email: ['Invalid format'] }
 * }
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Success Response Helper
 * 
 * Sends a successful API response with optional data payload.
 * Sets HTTP status code and formats response according to ApiResponse interface.
 * 
 * @template T - Type of data payload
 * @param {Response} res - Express response object
 * @param {T} [data] - Response payload to return to client
 * @param {string} [message] - Optional human-readable success message
 * @param {number} [statusCode=200] - HTTP status code (default 200 OK)
 * @returns {Response} Express response object for chaining
 * 
 * @example
 * const user = await userService.create(userData);
 * successResponse(res, user, 'User created', 201);
 * 
 * @example
 * const items = await itemService.getAll();
 * successResponse(res, items);
 */
export function successResponse<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data
  };
  
  return res.status(statusCode).json(response);
}

/**
 * Error Response Helper
 * 
 * Sends an error API response with error code and optional validation errors.
 * Used for business logic errors, authentication failures, and other error scenarios.
 * 
 * @param {Response} res - Express response object
 * @param {string} message - Human-readable error message
 * @param {string} [error] - Error code/identifier
 * @param {number} [statusCode=400] - HTTP status code (default 400 Bad Request)
 * @param {Record<string, string[]>} [errors] - Field-specific validation errors
 * @returns {Response} Express response object for chaining
 * 
 * @example
 * errorResponse(res, 'User not found', 'NOT_FOUND', 404);
 * 
 * @example
 * errorResponse(res, 'Unauthorized', 'UNAUTHORIZED', 401);
 */
export function errorResponse(
  res: Response,
  message: string,
  error?: string,
  statusCode: number = 400,
  errors?: Record<string, string[]>
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    error,
    errors
  };
  
  return res.status(statusCode).json(response);
}

/**
 * Validation Error Response Helper
 * 
 * Convenience function for sending validation error responses.
 * Automatically formats field validation errors for client display.
 * 
 * @param {Response} res - Express response object
 * @param {Record<string, string[]>} errors - Field validation errors
 * @returns {Response} Express response object for chaining
 * 
 * @example
 * try {
 *   await validateDto(UserRegisterDTO, requestData);
 * } catch (validationError) {
 *   validationErrorResponse(res, validationError.formatErrors());
 * }
 */
export function validationErrorResponse(
  res: Response,
  errors: Record<string, string[]>
): Response {
  return errorResponse(
    res,
    'Invalid data',
    'VALIDATION_ERROR',
    400,
    errors
  );
}

