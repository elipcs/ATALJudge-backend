/**
 * @module services/TokenManagementService
 * @description Service for refreshing JWT tokens.
 * 
 * This service handles:
 * - Refreshing access tokens using refresh tokens
 * - Token validation and verification
 * - Token rotation and revocation
 * 
 * @example
 * const tokenMgmtService = container.resolve(TokenManagementService);
 * const tokens = await tokenMgmtService.refreshToken(oldRefreshToken);
 */

import { injectable, inject } from 'tsyringe';
import { TokenManager } from '../utils/TokenManager';
import { RefreshTokenService } from './RefreshTokenService';
import { config } from '../config';
import { logger, TokenError } from '../utils';

/**
 * Service for managing token refresh operations.
 * 
 * @class TokenManagementService
 */
@injectable()
export class TokenManagementService {
  constructor(
    @inject(RefreshTokenService) private refreshTokenService: RefreshTokenService
  ) {}

  /**
   * Refreshes an expired access token using a valid refresh token.
   * 
   * @async
   * @param {string} oldRefreshToken - The refresh token to use
   * @returns {Promise<{accessToken: string; refreshToken: string}>} New token pair
   * @throws {TokenError} If refresh token is invalid or expired
   */
  async refreshToken(oldRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    if (!oldRefreshToken || typeof oldRefreshToken !== 'string' || oldRefreshToken.length < 100) {
      throw new TokenError('Refresh token invalid: incorrect format', 'INVALID_TOKEN_FORMAT');
    }

    const payload = TokenManager.verifyRefreshToken(oldRefreshToken);

    if (!payload || !payload.sub || typeof payload.sub !== 'string') {
      throw new TokenError('Refresh token invalid: incomplete payload', 'INVALID_TOKEN_PAYLOAD');
    }

    const storedToken = await this.refreshTokenService.validateAndUseToken(oldRefreshToken);
    await this.refreshTokenService.revokeToken(oldRefreshToken);
    const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);
    await this.refreshTokenService.saveRefreshToken(
      payload.sub,
      refreshToken,
      config.jwt.refreshExpires,
      storedToken.ipAddress,
      storedToken.userAgent,
      storedToken.familyId 
    );

    logger.info('[TOKEN] Tokens refreshed', { userId: payload.sub });

    return {
      accessToken,
      refreshToken
    };
  }
}
