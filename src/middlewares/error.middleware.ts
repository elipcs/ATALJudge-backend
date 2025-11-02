import { Request, Response, NextFunction } from 'express';
import { errorResponse, validationErrorResponse } from '../utils/responses';
import { logger, AppError, ValidationError as CustomValidationError } from '../utils';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  
  if (res.headersSent) {
    logger.warn('[ERROR] Resposta já enviada, não é possível enviar erro', {
      path: req.path,
      method: req.method,
      error: error.message
    });
    return;
  }

  const errorInfo = error instanceof Error
    ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      }
    : {
        error: String(error),
        type: typeof error
      };

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error('[ERROR] Erro na aplicação', { 
        ...errorInfo,
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        path: req.path, 
        method: req.method 
      });
    } else {
      logger.warn('[ERROR] Erro operacional', { 
        ...errorInfo,
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        path: req.path, 
        method: req.method 
      });
    }
  } else {
    logger.error('[ERROR] Erro inesperado', { 
      ...errorInfo,
      path: req.path, 
      method: req.method 
    });
  }

  if (error instanceof CustomValidationError) {
    validationErrorResponse(res, error.errors || {});
    return;
  }
  
  if (error instanceof AppError) {
    errorResponse(res, error.message, error.errorCode, error.statusCode);
    return;
  }

  if (error.name === 'QueryFailedError') {
    errorResponse(res, 'Erro ao processar dados', 'DATABASE_ERROR', 400);
    return;
  }

  errorResponse(
    res,
    'Erro interno do servidor',
    'INTERNAL_ERROR',
    500
  );
}

export function notFoundHandler(_req: Request, res: Response): void {
  errorResponse(res, 'Rota não encontrada', 'NOT_FOUND', 404);
}

