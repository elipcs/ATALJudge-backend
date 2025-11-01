import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper para handlers assíncronos que garante que erros sejam passados
 * corretamente para o middleware de erro do Express
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}



