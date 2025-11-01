import { Router, Response } from 'express';
import { AuthService } from '../services';
import { UserRegisterDTO, UserLoginDTO, RequestPasswordResetDTO, ResetPasswordDTO, RefreshTokenDTO } from '../dtos';
import { validateBody, authenticate, AuthRequest, convertUserRegisterPayload, authRateLimiter, registerRateLimiter } from '../middlewares';
import { successResponse, errorResponse } from '../utils/responses';
import { logger, sanitizeForLog } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';

function createAuthController(authService: AuthService): Router {
  const router = Router();

/**
 * POST /api/auth/register
 * Registra um novo usuário com convite
 */
router.post(
  '/register',
  registerRateLimiter, // Rate limiting rigoroso: 3 registros/hora
  (req, _res, next) => {
    logger.debug('[REGISTER] Body recebido', { 
      body: sanitizeForLog(req.body), 
      contentType: req.headers['content-type'] 
    });
    next();
  },
  convertUserRegisterPayload,
  validateBody(UserRegisterDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      logger.info('[REGISTER] Validação passou, registrando usuário...');
      const result = await authService.registerWithInvite(req.body);
      
      successResponse(
        res,
        result,
        'Usuário registrado com sucesso',
        201
      );
    } catch (error) {
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * POST /api/auth/login
 * Login com email e senha
 */
router.post(
  '/login',
  authRateLimiter, // Rate limiting rigoroso: 5 tentativas/15min
  validateBody(UserLoginDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];
      
      const result = await authService.loginWithEmail(
        req.body,
        ipAddress,
        userAgent
      );
      
      // Log para verificar o que está sendo retornado
      logger.debug('[LOGIN] Retornando resposta', {
        hasUser: !!result.user,
        hasAccessToken: !!result.accessToken,
        hasRefreshToken: !!result.refreshToken,
        accessTokenLength: result.accessToken?.length,
        refreshTokenLength: result.refreshToken?.length
      });
      
      successResponse(res, result, 'Login realizado com sucesso');
    } catch (error) {
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * POST /api/auth/refresh
 * Renova os tokens de acesso
 */
router.post(
  '/refresh',
  authRateLimiter,
  (req, _res, next) => {
    // Log detalhado ANTES da validação para ver o que está chegando
    logger.debug('[REFRESH] Request recebido (antes da validação)', {
      bodyKeys: Object.keys(req.body || {}),
      refreshTokenType: typeof req.body?.refreshToken,
      refreshTokenLength: req.body?.refreshToken?.length,
      refreshTokenValue: req.body?.refreshToken ? `${req.body.refreshToken.substring(0, 30)}...` : 'undefined',
      fullBody: JSON.stringify(req.body).substring(0, 300),
      contentType: req.headers['content-type'],
      rawBody: typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body)
    });
    next();
  },
  validateBody(RefreshTokenDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    // Após validação do DTO, o refreshToken já está validado
    const { refreshToken } = req.body;
    
    logger.debug('[REFRESH] Token validado, iniciando renovação', {
      tokenLength: refreshToken?.length,
      tokenStart: refreshToken?.substring(0, 20)
    });
    
    const result = await authService.refreshToken(refreshToken);
    
    logger.info('[REFRESH] Tokens renovados com sucesso');
    successResponse(res, result, 'Tokens renovados com sucesso');
  })
);

/**
 * POST /api/auth/logout
 * Faz logout do usuário
 */
router.post(
  '/logout',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const accessToken = req.headers.authorization?.split(' ')[1];
      const { refreshToken } = req.body;
      
      if (!accessToken) {
        errorResponse(res, 'Token não fornecido', 'MISSING_TOKEN', 400);
        return;
      }
      
      await authService.logout(accessToken, refreshToken);
      
      successResponse(res, null, 'Logout realizado com sucesso');
    } catch (error) {
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get(
  '/me',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      logger.debug('[ME] Buscando dados do usuário autenticado...');
      logger.debug('[ME] User', { user: req.user ? { userId: req.user.userId, email: req.user.email } : 'não autenticado' });
      
      if (!req.user) {
        logger.warn('[ME] Usuário não autenticado');
        errorResponse(res, 'Usuário não autenticado', 'UNAUTHORIZED', 401);
        return;
      }
      
      logger.info('[ME] Dados do usuário encontrados');
      successResponse(res, req.user, 'Dados do usuário');
    } catch (error) {
      logger.error('[ME] Erro ao buscar dados', { error });
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Solicita reset de senha e envia email
 */
router.post(
  '/forgot-password',
  authRateLimiter, // Rate limiting: 5 tentativas/15min
  validateBody(RequestPasswordResetDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await authService.requestPasswordReset(req.body);
      successResponse(res, result, result.message);
    } catch (error) {
      if (error instanceof Error) {
        logger.error('[FORGOT-PASSWORD] Erro ao solicitar reset', { error: error.message });
      }
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Confirma reset de senha com token
 */
router.post(
  '/reset-password',
  authRateLimiter, // Rate limiting: 5 tentativas/15min
  (req, _res, next) => {
    logger.debug('[RESET-PASSWORD] Body recebido', { 
      body: sanitizeForLog(req.body), 
      contentType: req.headers['content-type'],
      hasToken: !!req.body?.token,
      hasNewPassword: !!req.body?.newPassword
    });
    next();
  },
  validateBody(ResetPasswordDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await authService.resetPassword(req.body);
      successResponse(res, result, result.message);
    } catch (error) {
      if (error instanceof Error) {
        logger.error('[RESET-PASSWORD] Erro ao resetar senha', { error: error.message });
      }
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

  return router;
}

// Exportar função factory e instância default para compatibilidade
export default createAuthController;

