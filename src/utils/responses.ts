import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

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

export function validationErrorResponse(
  res: Response,
  errors: Record<string, string[]>
): Response {
  return errorResponse(
    res,
    'Dados inválidos',
    'VALIDATION_ERROR',
    400,
    errors
  );
}

