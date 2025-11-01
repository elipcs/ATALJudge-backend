/**
 * Classes de erro customizadas para o sistema
 * Facilitam o tratamento de erros e mapeamento para códigos HTTP
 */

/**
 * Erro base do sistema
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    
    // Mantém o stack trace correto
    Error.captureStackTrace(this, this.constructor);
    
    // Define o nome da classe
    this.name = this.constructor.name;
  }
}

/**
 * Erro 404 - Recurso não encontrado
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado', errorCode: string = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

/**
 * Erro 400 - Validação de dados
 */
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

/**
 * Erro 401 - Não autenticado
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autenticado', errorCode: string = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

/**
 * Erro 403 - Sem permissão
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Sem permissão para acessar este recurso', errorCode: string = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

/**
 * Erro 409 - Conflito (ex: email já existe)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflito de dados', errorCode: string = 'CONFLICT') {
    super(message, 409, errorCode);
  }
}

/**
 * Erro 422 - Regra de negócio violada
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, errorCode: string = 'BUSINESS_RULE_ERROR') {
    super(message, 422, errorCode);
  }
}

/**
 * Erro 429 - Muitas requisições
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Muitas requisições, tente novamente mais tarde', errorCode: string = 'RATE_LIMIT') {
    super(message, 429, errorCode);
  }
}

/**
 * Erro 500 - Erro interno do servidor
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Erro interno do servidor', errorCode: string = 'INTERNAL_ERROR') {
    super(message, 500, errorCode);
  }
}

/**
 * Erro de token expirado ou inválido
 */
export class TokenError extends UnauthorizedError {
  constructor(message: string, errorCode: string = 'TOKEN_ERROR') {
    super(message, errorCode);
  }
}

/**
 * Helper para verificar se é um erro operacional (esperado)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

