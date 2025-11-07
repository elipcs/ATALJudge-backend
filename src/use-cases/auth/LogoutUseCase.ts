import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { TokenBlacklistRepository } from '../../repositories';
import { RefreshTokenService } from '../../services/RefreshTokenService';
import { TokenManager } from '../../utils/TokenManager';
import { config } from '../../config';
import { logger } from '../../utils';

export interface LogoutUseCaseInput {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Use Case: Perform user logout
 * 
 * Responsibilities:
 * - Invalidate access token (add to blacklist)
 * - Revoke refresh token (if provided)
 * - Log logout in the system
 */
@injectable()
export class LogoutUseCase implements IUseCase<LogoutUseCaseInput, void> {
  constructor(
    @inject(TokenBlacklistRepository) private tokenBlacklistRepository: TokenBlacklistRepository,
    @inject(RefreshTokenService) private refreshTokenService: RefreshTokenService
  ) {}

  async execute(input: LogoutUseCaseInput): Promise<void> {
    const { accessToken, refreshToken } = input;

    // 1. Validate access token
    TokenManager.verifyAccessToken(accessToken);

    // 2. Add access token to blacklist
    await this.tokenBlacklistRepository.create({
      token: accessToken,
      expiresAt: TokenManager.calculateExpirationDate(config.jwt.accessExpires),
      reason: 'logout'
    });

    // 3. Revoke refresh token (if provided)
    if (refreshToken) {
      await this.refreshTokenService.revokeToken(refreshToken);
    }

    logger.info('[LogoutUseCase] Logout performed successfully');
  }
}
