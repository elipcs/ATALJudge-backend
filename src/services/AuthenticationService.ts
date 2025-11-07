/**
 * @module services/AuthenticationService
 * @description Service for user authentication and login.
 * 
 * This service handles:
 * - User login with email and password
 * - Token generation and management
 * - Logout and token blacklisting
 * - Credentials validation
 */

import { injectable, inject } from 'tsyringe';
import { UserRepository, TokenBlacklistRepository } from '../repositories';
import { TokenManager, JwtPayload } from '../utils/TokenManager';
import { UserLoginDTO, UserResponseDTO } from '../dtos';
import { RefreshTokenService } from './RefreshTokenService';
import { config } from '../config';
import { logger, UnauthorizedError } from '../utils';

/**
 * Service for user authentication.
 * @class AuthenticationService
 */
@injectable()
export class AuthenticationService {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(RefreshTokenService) private refreshTokenService: RefreshTokenService,
    @inject(TokenBlacklistRepository) private tokenBlacklistRepository: TokenBlacklistRepository
  ) {}


  async loginWithEmail(
    dto: UserLoginDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: UserResponseDTO;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Email ou senha incorretos', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await user.checkPassword(dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Email ou senha incorretos', 'INVALID_CREDENTIALS');
    }

    await this.userRepository.updateLastLogin(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);

    await this.refreshTokenService.saveRefreshToken(
      user.id,
      refreshToken,
      config.jwt.refreshExpires,
      ipAddress,
      userAgent
    );

    await this.refreshTokenService.enforceTokenLimit(user.id, 5);

    logger.info('[AUTH] Login bem-sucedido', { userId: user.id, email: user.email });

    return {
      user: new UserResponseDTO(user),
      accessToken,
      refreshToken
    };
  }


  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    TokenManager.verifyAccessToken(accessToken);
    
    await this.tokenBlacklistRepository.create({
      token: accessToken,
      expiresAt: TokenManager.calculateExpirationDate(config.jwt.accessExpires),
      reason: 'logout'
    });

    if (refreshToken) {
      await this.refreshTokenService.revokeToken(refreshToken);
    }

    logger.info('[AUTH] Logout realizado');
  }


  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
    logger.info('[AUTH] Logout de todos os dispositivos', { userId });
  }
}
