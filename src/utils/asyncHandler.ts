/**
 * Async Handler Module
 * 
 * Provides wrapper function for Express route handlers that return promises.
 * Automatically catches any errors thrown in async handlers and passes them to Express error middleware.
 * Eliminates the need for try-catch blocks in every async route handler.
 * 
 * @module utils/asyncHandler
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Async Handler Wrapper
 * 
 * Wraps async Express route handlers to automatically catch promise rejections.
 * Passes caught errors to the next middleware (error handler).
 * 
 * @function asyncHandler
 * @template T - The return type of the handler function
 * @param {Function} fn - Async Express middleware/route handler function
 * @returns {Function} Express middleware function with error handling
 * 
 * @example
 * router.post('/users', asyncHandler(async (req, res, next) => {
 *   const user = await userService.create(req.body);
 *   res.json(user);
 *   // Any error thrown will be caught and passed to error middleware
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}



