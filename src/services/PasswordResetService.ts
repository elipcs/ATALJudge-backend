/**
 * @module services/PasswordResetService
 * @description Service to manage password reset tokens.
 * Provides operations to create, validate and delete reset tokens,
 * as well as manage token expiration.
 * @class PasswordResetService
 */
import { injectable, inject } from 'tsyringe';
import { PasswordResetTokenRepository } from '../repositories/PasswordResetTokenRepository';
import { PasswordResetToken } from '../models/PasswordResetToken';
import * as crypto from 'crypto';

@injectable()
export class PasswordResetService {
  constructor(
    @inject(PasswordResetTokenRepository) private tokenRepository: PasswordResetTokenRepository
  ) {}

  async createResetToken(userId: string, expirationHours: number = 1): Promise<string> {
    
    const token = crypto.randomBytes(32).toString('hex');

    const resetToken = new PasswordResetToken();
    resetToken.userId = userId;
    resetToken.setToken(token);
    resetToken.expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    resetToken.isUsed = false;

    await this.tokenRepository.create(resetToken);

    return token;
  }

  async validateToken(token: string): Promise<PasswordResetToken | null> {
    
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const resetToken = await this.tokenRepository.findValidToken(tokenHash);

    return resetToken;
  }

  async markTokenAsUsed(token: PasswordResetToken): Promise<void> {
    token.markAsUsed();
    await this.tokenRepository.save(token);
  }

  async revokeToken(token: PasswordResetToken): Promise<void> {
    await this.tokenRepository.delete(token.id);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepository.deleteByUserId(userId);
  }

  async cleanupExpiredTokens(): Promise<number> {
    return this.tokenRepository.deleteExpired();
  }
}

