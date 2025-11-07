import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { RefreshTokenDTO } from '../../dtos';
import { RefreshTokenService } from '../../services/RefreshTokenService';
import { TokenManager, JwtPayload } from '../../utils/TokenManager';
import { logger } from '../../utils';

export interface RefreshTokenUseCaseOutput {
  accessToken: string;
  refreshToken: string;
}

/**
 * Use Case: Renew authentication tokens
 * 
 * Responsibilities:
 * - Validate refresh token
 * - Check if token has not been revoked
 * - Generate new token pair
 * - Invalidate old refresh token
 * - Save new refresh token
 */
@injectable()
export class RefreshTokenUseCase implements IUseCase<RefreshTokenDTO, RefreshTokenUseCaseOutput> {
  constructor(
    @inject(RefreshTokenService) private refreshTokenService: RefreshTokenService
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<RefreshTokenUseCaseOutput> {
    // 1. Validate and decode refresh token
    const decoded = TokenManager.verifyRefreshToken(dto.refreshToken);

    // 2. Validate and use token (marks as used and checks validity)
    const storedToken = await this.refreshTokenService.validateAndUseToken(dto.refreshToken);

    // 3. Create new payload
    const payload: JwtPayload = {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };

    // 4. Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = TokenManager.generateTokenPair(payload);

    // 5. Save new refresh token with same familyId (token rotation)
    await this.refreshTokenService.saveRefreshToken(
      decoded.sub,
      newRefreshToken,
      7 * 24 * 60 * 60, // 7 days in seconds
      storedToken.ipAddress,
      storedToken.userAgent,
      storedToken.familyId
    );

    logger.info('[RefreshTokenUseCase] Tokens renewed', { userId: decoded.sub });

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }
}
