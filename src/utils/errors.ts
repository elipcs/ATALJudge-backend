

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado', errorCode: string = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;

  constructor(
    message: string = 'Dados inválidos',
    errorCode: string = 'VALIDATION_ERROR',
    errors?: Record<string, string[]>
  ) {
    super(message, 400, errorCode);
    this.errors = errors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autenticado', errorCode: string = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Sem permissão para acessar este recurso', errorCode: string = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflito de dados', errorCode: string = 'CONFLICT') {
    super(message, 409, errorCode);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, errorCode: string = 'BUSINESS_RULE_ERROR') {
    super(message, 422, errorCode);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Muitas requisições, tente novamente mais tarde', errorCode: string = 'RATE_LIMIT') {
    super(message, 429, errorCode);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Erro interno do servidor', errorCode: string = 'INTERNAL_ERROR') {
    super(message, 500, errorCode);
  }
}

export class TokenError extends UnauthorizedError {
  constructor(message: string, errorCode: string = 'TOKEN_ERROR') {
    super(message, errorCode);
  }
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

