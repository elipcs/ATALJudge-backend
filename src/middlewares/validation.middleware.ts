/**
 * Request Validation Middleware Module
 * 
 * Provides DTO validation for request bodies.
 * Uses class-validator for schema validation.
 * 
 * @module middlewares/validation
 */
import { Request, Response, NextFunction } from 'express';
import { validateDto, ValidationException } from '../utils/validators';
import { validationErrorResponse } from '../utils/responses';
import { logger } from '../utils';

/**
 * Request body validation middleware factory
 * 
 * Creates middleware that validates request body against a DTO class.
 * 
 * @template T - The DTO class type
 * @function validateBody
 * @param {new () => T} dtoClass - The DTO class to validate against
 * @returns {Function} Express middleware function
 * @example
 * router.post('/user', validateBody(UserRegisterDTO), handler);
 */
export function validateBody<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await validateDto(dtoClass, req.body);
      next();
    } catch (error) {
      if (error instanceof ValidationException) {
        const formattedErrors = error.formatErrors();
        logger.warn('[VALIDATION] Validation errors', { 
          path: req.path,
          method: req.method,
          errors: formattedErrors,
          bodyKeys: Object.keys(req.body || {}),
          bodyValues: Object.keys(req.body || {}).reduce((acc, key) => {
            acc[key] = key === 'newPassword' || key === 'password' ? '[HIDDEN]' : req.body[key];
            return acc;
          }, {} as Record<string, any>)
        });
        validationErrorResponse(res, formattedErrors);
        return;
      }
      
      logger.error('[VALIDATION] Unknown error', { error, path: req.path });
      validationErrorResponse(res, { general: ['Validation error'] });
    }
  };
}

export function validateQuery<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await validateDto(dtoClass, req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ValidationException) {
        validationErrorResponse(res, error.formatErrors());
        return;
      }
      
      validationErrorResponse(res, { general: ['Erro de validação'] });
    }
  };
}

