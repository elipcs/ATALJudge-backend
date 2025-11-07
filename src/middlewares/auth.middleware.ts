/**
 * Authentication Middleware Module
 * 
 * Provides middleware functions for JWT authentication and authorization.
 * Handles token validation, blacklist checking, and role-based access control.
 * 
 * @module middlewares/auth
 */
import { Request, Response, NextFunction } from 'express';
import { TokenManager, JwtPayload } from '../utils/TokenManager';
import { errorResponse } from '../utils/responses';
import { logger } from '../utils';
import { TokenBlacklistRepository } from '../repositories/TokenBlacklistRepository';
import { UserRole } from '../enums';

/**
 * Extended Request interface with authenticated user payload
 * 
 * @interface AuthRequest
 * @extends {Request}
 */
export interface AuthRequest extends Request {
  /** JWT payload of authenticated user */
  user?: JwtPayload;
}

const tokenBlacklistRepo = new TokenBlacklistRepository();

/**
 * Authentication middleware
 * 
 * Validates JWT token from Authorization header and extracts user information.
 * Checks token blacklist to prevent use of logged-out tokens.
 * 
 * @async
 * @function authenticate
 * @param {AuthRequest} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 * @throws {Error} If token validation fails
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = TokenManager.extractBearerToken(req.headers.authorization);
    
    if (!token) {
      logger.warn('[AUTH] Token não fornecido');
      errorResponse(res, 'Token não fornecido', 'UNAUTHORIZED', 401);
      return;
    }

    const blacklisted = await tokenBlacklistRepo.findByToken(token);
    
    if (blacklisted) {
      logger.warn('[AUTH] Token está na blacklist', { token: token.substring(0, 10) + '...' });
      errorResponse(res, 'Token revogado', 'TOKEN_REVOKED', 401);
      return;
    }

    const payload = TokenManager.verifyAccessToken(token);
    req.user = payload;
    
    next();
  } catch (error) {
    
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
    
    logger.error('[AUTH] Erro na autenticação', { 
      ...errorInfo,
      path: req.path,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization
    });
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('expirado') || errorMessage.includes('expired')) {
        errorResponse(res, 'Token expirado', 'TOKEN_EXPIRED', 401);
        return;
      }
      if (errorMessage.includes('inválido') || errorMessage.includes('invalid') || errorMessage.includes('malformed')) {
        errorResponse(res, 'Token inválido', 'INVALID_TOKEN', 401);
        return;
      }
      if (errorMessage.includes('secret') || errorMessage.includes('jwt')) {
        errorResponse(res, 'Erro na verificação do token', 'TOKEN_VERIFICATION_ERROR', 401);
        return;
      }
    }
    
    errorResponse(res, 'Erro na autenticação', 'AUTH_ERROR', 401);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Usuário não autenticado', 'UNAUTHORIZED', 401);
      return;
    }
    
    if (!roles.includes(req.user.role as UserRole)) {
      errorResponse(
        res,
        'Você não tem permissão para acessar este recurso',
        'FORBIDDEN',
        403
      );
      return;
    }
    
    next();
  };
}

export const requireProfessor = requireRole(UserRole.PROFESSOR);

export const requireTeacher = requireRole(UserRole.PROFESSOR, UserRole.ASSISTANT);

export function requireOwnResourceOrTeacher(resourceIdParam: string = 'studentId') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Usuário não autenticado', 'UNAUTHORIZED', 401);
      return;
    }

    if (req.user.role === UserRole.PROFESSOR || req.user.role === UserRole.ASSISTANT) {
      next();
      return;
    }

    if (req.user.role === UserRole.STUDENT) {
      const resourceId = req.params[resourceIdParam];
      if (req.user.sub !== resourceId) {
        errorResponse(
          res,
          'Sem permissão para acessar este recurso',
          'FORBIDDEN',
          403
        );
        return;
      }
    }

    next();
  };
}

