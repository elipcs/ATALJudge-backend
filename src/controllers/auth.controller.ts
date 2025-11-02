import { Router, Response } from 'express';
import { AuthService } from '../services';
import { UserRegisterDTO, UserLoginDTO, RequestPasswordResetDTO, ResetPasswordDTO, RefreshTokenDTO } from '../dtos';
import { validateBody, authenticate, AuthRequest, convertUserRegisterPayload, authRateLimiter, registerRateLimiter } from '../middlewares';
import { successResponse, errorResponse } from '../utils/responses';
import { logger, sanitizeForLog } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';

function createAuthController(authService: AuthService): Router {
  const router = Router();

router.post(
  '/register',
  registerRateLimiter, 
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
      
      throw error;
    }
  }
);

router.post(
  '/login',
  authRateLimiter, 
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

      logger.debug('[LOGIN] Retornando resposta', {
        hasUser: !!result.user,
        hasAccessToken: !!result.accessToken,
        hasRefreshToken: !!result.refreshToken,
        accessTokenLength: result.accessToken?.length,
        refreshTokenLength: result.refreshToken?.length
      });
      
      successResponse(res, result, 'Login realizado com sucesso');
    } catch (error) {
      
      throw error;
    }
  }
);

router.post(
  '/refresh',
  authRateLimiter,
  (req, _res, next) => {
    
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
      
      throw error;
    }
  }
);

router.get(
  '/me',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      logger.debug('[ME] Buscando dados do usuário autenticado...');
      logger.debug('[ME] User', { user: req.user ? { userId: req.user.sub, email: req.user.email } : 'não autenticado' });
      
      if (!req.user) {
        logger.warn('[ME] Usuário não autenticado');
        errorResponse(res, 'Usuário não autenticado', 'UNAUTHORIZED', 401);
        return;
      }
      
      logger.info('[ME] Dados do usuário encontrados');
      successResponse(res, req.user, 'Dados do usuário');
    } catch (error) {
      logger.error('[ME] Erro ao buscar dados', { error });
      
      throw error;
    }
  }
);

router.post(
  '/forgot-password',
  authRateLimiter, 
  validateBody(RequestPasswordResetDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await authService.requestPasswordReset(req.body);
      successResponse(res, result, result.message);
    } catch (error) {
      if (error instanceof Error) {
        logger.error('[FORGOT-PASSWORD] Erro ao solicitar reset', { error: error.message });
      }
      
      throw error;
    }
  }
);

router.post(
  '/reset-password',
  authRateLimiter, 
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
      
      throw error;
    }
  }
);

  return router;
}

export default createAuthController;

