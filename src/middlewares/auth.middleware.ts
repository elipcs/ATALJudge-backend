import { Request, Response, NextFunction } from 'express';
import { TokenManager, JwtPayload } from '../utils/TokenManager';
import { errorResponse } from '../utils/responses';
import { logger } from '../utils';
import { AppDataSource } from '../config/database';
import { TokenBlacklist } from '../models/TokenBlacklist';
import { UserRole } from '../enums';

/**
 * Estende o Request do Express para incluir o usuário autenticado
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware de autenticação JWT
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.debug('[AUTH] Verificando autenticação...');
    
    // Extrair token do header
    const token = TokenManager.extractBearerToken(req.headers.authorization);
    
    if (!token) {
      logger.warn('[AUTH] Token não fornecido');
      errorResponse(res, 'Token não fornecido', 'UNAUTHORIZED', 401);
      return;
    }
    
    logger.debug('[AUTH] Token encontrado, verificando blacklist...');
    
    // Verificar se o token está na blacklist
    const tokenBlacklistRepo = AppDataSource.getRepository(TokenBlacklist);
    const blacklisted = await tokenBlacklistRepo.findOne({ where: { token } });
    
    if (blacklisted) {
      logger.warn('[AUTH] Token está na blacklist');
      errorResponse(res, 'Token revogado', 'TOKEN_REVOKED', 401);
      return;
    }
    
    logger.debug('[AUTH] Verificando validade do token...');
    
    // Verificar e decodificar o token
    const payload = TokenManager.verifyAccessToken(token);
    
    logger.info('[AUTH] Token válido, usuário autenticado', { userId: payload.userId, role: payload.role });
    
    // Adicionar payload ao request
    req.user = payload;
    
    next();
  } catch (error) {
    // Extrair informações do erro para logging adequado
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

/**
 * Middleware para verificar se o usuário tem um papel específico
 */
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

/**
 * Middleware para verificar se o usuário é professor
 */
export const requireProfessor = requireRole(UserRole.PROFESSOR);

/**
 * Middleware para verificar se o usuário é professor ou assistente
 */
export const requireTeacher = requireRole(UserRole.PROFESSOR, UserRole.ASSISTANT);

/**
 * Middleware para verificar se um estudante está acessando apenas seus próprios recursos
 * ou se é um professor/assistente (que pode acessar recursos de qualquer estudante)
 * @param resourceIdParam Nome do parâmetro da rota que contém o ID do recurso (padrão: 'studentId')
 */
export function requireOwnResourceOrTeacher(resourceIdParam: string = 'studentId') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Usuário não autenticado', 'UNAUTHORIZED', 401);
      return;
    }

    // Professores e assistentes podem acessar recursos de qualquer estudante
    if (req.user.role === UserRole.PROFESSOR || req.user.role === UserRole.ASSISTANT) {
      next();
      return;
    }

    // Estudantes só podem acessar seus próprios recursos
    if (req.user.role === UserRole.STUDENT) {
      const resourceId = req.params[resourceIdParam];
      if (req.user.userId !== resourceId) {
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

