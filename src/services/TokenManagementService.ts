import { injectable, inject } from 'tsyringe';
import { TokenManager } from '../utils/TokenManager';
import { RefreshTokenService } from './RefreshTokenService';
import { config } from '../config';
import { logger, TokenError } from '../utils';


@injectable()
export class TokenManagementService {
  constructor(
    @inject(RefreshTokenService) private refreshTokenService: RefreshTokenService
  ) {}


  async refreshToken(oldRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    if (!oldRefreshToken || typeof oldRefreshToken !== 'string' || oldRefreshToken.length < 100) {
      throw new TokenError('Refresh token inválido: formato incorreto', 'INVALID_TOKEN_FORMAT');
    }

    const payload = TokenManager.verifyRefreshToken(oldRefreshToken);

    if (!payload || !payload.sub || typeof payload.sub !== 'string') {
      throw new TokenError('Refresh token inválido: payload incompleto', 'INVALID_TOKEN_PAYLOAD');
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

    logger.info('[TOKEN] Tokens renovados', { userId: payload.sub });

    return {
      accessToken,
      refreshToken
    };
  }
}
