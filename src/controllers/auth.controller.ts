/**
 * Authentication Controller Module
 * 
 * Handles all authentication-related HTTP endpoints:
 * - User registration and login
 * - Token refresh and logout
 * - Password reset functionality
 * - Authenticated user information retrieval
 * 
 * Uses role-based access control and rate limiting for security.
 * 
 * @module controllers/auth
 */
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

/**
 * Creates and configures the authentication router
 * 
 * @param {LoginUseCase} loginUseCase - Use case for user login
 * @param {RegisterUserUseCase} registerUserUseCase - Use case for user registration
 * @param {RefreshTokenUseCase} refreshTokenUseCase - Use case for token refresh
 * @param {LogoutUseCase} logoutUseCase - Use case for user logout
 * @param {RequestPasswordResetUseCase} requestPasswordResetUseCase - Use case for password reset requests
 * @param {ResetPasswordUseCase} resetPasswordUseCase - Use case for password reset
 * @returns {Router} Express router with all authentication routes
 */
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
    logger.debug('[REGISTER] Body received', { 
      body: sanitizeForLog(req.body), 
      contentType: req.headers['content-type'] 
    });
    next();
  },
  convertUserRegisterPayload,
  validateBody(UserRegisterDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    logger.info('[REGISTER] Validation passed, registering user...');
    const result = await registerUserUseCase.execute(req.body);
    
    successResponse(
      res,
      result,
      'User registered successfully',
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

    logger.debug('[LOGIN] Returning response', {
      hasUser: !!result.user,
      hasAccessToken: !!result.accessToken,
      hasRefreshToken: !!result.refreshToken,
      accessTokenLength: result.accessToken?.length,
      refreshTokenLength: result.refreshToken?.length
    });
    
    successResponse(res, result, 'Login successful');
  })
);

router.post(
  '/refresh',
  authRateLimiter,
  (req, _res, next) => {
    
    logger.debug('[REFRESH] Request received (before validation)', {
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
    
    logger.debug('[REFRESH] Token validated, starting renewal', {
      tokenLength: refreshToken?.length,
      tokenStart: refreshToken?.substring(0, 20)
    });
    
    const result = await refreshTokenUseCase.execute({ refreshToken });
    
    logger.info('[REFRESH] Tokens renewed successfully');
    successResponse(res, result, 'Tokens renewed successfully');
  })
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { refreshToken } = req.body;
    
    if (!accessToken) {
      errorResponse(res, 'Token not provided', 'MISSING_TOKEN', 400);
      return;
    }
    
    await logoutUseCase.execute({ accessToken, refreshToken });
    
    successResponse(res, null, 'Logout successful');
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    logger.debug('[ME] Fetching authenticated user data...');
    logger.debug('[ME] User', { user: req.user ? { userId: req.user.sub, email: req.user.email } : 'not authenticated' });
    
    if (!req.user) {
      logger.warn('[ME] User not authenticated');
      errorResponse(res, 'User not authenticated', 'UNAUTHORIZED', 401);
      return;
    }
    
    logger.info('[ME] User data found');
    successResponse(res, req.user, 'User data');
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

