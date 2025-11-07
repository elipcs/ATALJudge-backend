/**
 * @module services/RefreshTokenService
 * @description Service for managing refresh tokens and token families.
 * 
 * Handles token storage, validation, rotation, and revocation.
 */

import { injectable, inject } from 'tsyringe';
import { TokenManager } from '../utils/TokenManager';
import { RefreshTokenRepository } from '../repositories';
import { RefreshToken } from '../models/RefreshToken';
import { NotFoundError, UnauthorizedError } from '../utils';

/**
 * Service for refresh token management.
 * @class RefreshTokenService
 */
@injectable()
export class RefreshTokenService {
  constructor(
    @inject(RefreshTokenRepository) private tokenRepository: RefreshTokenRepository
  ) {}

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresInSeconds: number,
    ipAddress?: string,
    userAgent?: string,
    familyId?: string
  ): Promise<RefreshToken> {
    const refreshToken = new RefreshToken();
    refreshToken.userId = userId;
    refreshToken.setToken(token); 
    refreshToken.expiresAt = TokenManager.calculateExpirationDate(expiresInSeconds);
    refreshToken.ipAddress = ipAddress;
    refreshToken.userAgent = userAgent;
    refreshToken.familyId = familyId || TokenManager.generateFamilyId();

    return await this.tokenRepository.save(refreshToken);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = TokenManager.hashToken(token);
    return await this.tokenRepository.findByTokenHash(tokenHash);
  }

  async validateAndUseToken(token: string): Promise<RefreshToken> {
    const storedToken = await this.findByToken(token);

    if (!storedToken) {
      throw new NotFoundError('Token não encontrado', 'TOKEN_NOT_FOUND');
    }

    if (!storedToken.isValid()) {
      
      if (storedToken.familyId) {
        await this.revokeTokenFamily(storedToken.familyId);
      }
      throw new UnauthorizedError('Token inválido ou expirado - possível tentativa de roubo detectada', 'TOKEN_INVALID_OR_EXPIRED');
    }

    storedToken.markAsUsed();
    await this.tokenRepository.save(storedToken);

    return storedToken;
  }

  async revokeToken(token: string): Promise<void> {
    const tokenHash = TokenManager.hashToken(token);
    const resetToken = await this.tokenRepository.findByTokenHash(tokenHash);
    if (resetToken) {
      resetToken.isRevoked = true;
      await this.tokenRepository.save(resetToken);
    }
  }

  async revokeTokenFamily(familyId: string): Promise<void> {
    const tokens = await this.tokenRepository.findByFamilyId(familyId);
    for (const token of tokens) {
      token.isRevoked = true;
      await this.tokenRepository.save(token);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokens = await this.tokenRepository.findByUserId(userId);
    for (const token of tokens) {
      token.isRevoked = true;
      await this.tokenRepository.save(token);
    }
  }

  async enforceTokenLimit(userId: string, maxTokens: number = 5): Promise<void> {
    const userTokens = await this.tokenRepository.findByUserId(userId);
    const activeTokens = userTokens.filter(t => !t.isRevoked).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    if (activeTokens.length > maxTokens) {
      const tokensToRevoke = activeTokens.slice(maxTokens);

      for (const token of tokensToRevoke) {
        token.isRevoked = true;
        await this.tokenRepository.save(token);
      }
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    return this.tokenRepository.deleteExpiredTokens();
  }

  async cleanupRevokedTokens(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    return this.tokenRepository.deleteRevokedTokens(cutoffDate);
  }

  async getTokenStats(userId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
  }> {
    const tokens = await this.tokenRepository.findByUserId(userId);

    return {
      total: tokens.length,
      active: tokens.filter(t => t.isValid()).length,
      expired: tokens.filter(t => t.isExpired() && !t.isRevoked).length,
      revoked: tokens.filter(t => t.isRevoked).length
    };
  }
}

