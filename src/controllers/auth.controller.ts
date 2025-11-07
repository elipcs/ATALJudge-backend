import { Router, Response } from 'express';
import { 
  LoginUseCase, 
  RegisterUserUseCase, 
  RefreshTokenUseCase, 
  LogoutUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase
} from '../use-cases/auth';
import { UserRegisterDTO, UserLoginDTO, RequestPasswordResetDTO, ResetPasswordDTO, RefreshTokenDTO } from '../dtos';
import { validateBody, authenticate, AuthRequest, convertUserRegisterPayload, authRateLimiter, registerRateLimiter } from '../middlewares';
import { successResponse, errorResponse } from '../utils/responses';
import { logger, sanitizeForLog } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';


function createAuthController(
  loginUseCase: LoginUseCase,
  registerUserUseCase: RegisterUserUseCase,
  refreshTokenUseCase: RefreshTokenUseCase,
  logoutUseCase: LogoutUseCase,
  requestPasswordResetUseCase: RequestPasswordResetUseCase,
  resetPasswordUseCase: ResetPasswordUseCase
): Router {
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
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    logger.info('[REGISTER] Validação passou, registrando usuário...');
    const result = await registerUserUseCase.execute(req.body);
    
    successResponse(
      res,
      result,
      'Usuário registrado com sucesso',
      201
    );
  })
);

router.post(
  '/login',
  authRateLimiter, 
  validateBody(UserLoginDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    const result = await loginUseCase.execute({
      dto: req.body,
      ipAddress,
      userAgent
    });

    logger.debug('[LOGIN] Retornando resposta', {
      hasUser: !!result.user,
      hasAccessToken: !!result.accessToken,
      hasRefreshToken: !!result.refreshToken,
      accessTokenLength: result.accessToken?.length,
      refreshTokenLength: result.refreshToken?.length
    });
    
    successResponse(res, result, 'Login realizado com sucesso');
  })
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
    
    const result = await refreshTokenUseCase.execute(refreshToken);
    
    logger.info('[REFRESH] Tokens renovados com sucesso');
    successResponse(res, result, 'Tokens renovados com sucesso');
  })
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { refreshToken } = req.body;
    
    if (!accessToken) {
      errorResponse(res, 'Token não fornecido', 'MISSING_TOKEN', 400);
      return;
    }
    
    await logoutUseCase.execute({ accessToken, refreshToken });
    
    successResponse(res, null, 'Logout realizado com sucesso');
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    logger.debug('[ME] Buscando dados do usuário autenticado...');
    logger.debug('[ME] User', { user: req.user ? { userId: req.user.sub, email: req.user.email } : 'não autenticado' });
    
    if (!req.user) {
      logger.warn('[ME] Usuário não autenticado');
      errorResponse(res, 'Usuário não autenticado', 'UNAUTHORIZED', 401);
      return;
    }
    
    logger.info('[ME] Dados do usuário encontrados');
    successResponse(res, req.user, 'Dados do usuário');
  })
);

router.post(
  '/forgot-password',
  authRateLimiter, 
  validateBody(RequestPasswordResetDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await requestPasswordResetUseCase.execute(req.body);
    successResponse(res, result, result.message);
  })
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
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await resetPasswordUseCase.execute(req.body);
    successResponse(res, result, result.message);
  })
);

  return router;
}

export default createAuthController;

