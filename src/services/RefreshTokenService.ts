import { TokenManager } from '../utils/TokenManager';
import { RefreshTokenRepository } from '../repositories';
import { LessThan } from 'typeorm';
import { RefreshToken } from '../models/RefreshToken';
import { NotFoundError, UnauthorizedError } from '../utils';

/**
 * Service para gerenciar refresh tokens com segurança
 */
export class RefreshTokenService {
  private tokenRepository: RefreshTokenRepository;

  constructor(tokenRepository: RefreshTokenRepository) {
    this.tokenRepository = tokenRepository;
  }

  /**
   * Salva um novo refresh token
   */
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
    refreshToken.setToken(token); // Hash automático via TokenManager
    refreshToken.expiresAt = TokenManager.calculateExpirationDate(expiresInSeconds);
    refreshToken.ipAddress = ipAddress;
    refreshToken.userAgent = userAgent;
    refreshToken.familyId = familyId || TokenManager.generateFamilyId();

    return await this.tokenRepository.save(refreshToken);
  }

  /**
   * Busca token por hash
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = TokenManager.hashToken(token);
    return await this.tokenRepository.findByTokenHash(tokenHash);
  }

  /**
   * Valida e marca token como usado
   */
  async validateAndUseToken(token: string): Promise<RefreshToken> {
    const storedToken = await this.findByToken(token);

    if (!storedToken) {
      throw new NotFoundError('Token não encontrado', 'TOKEN_NOT_FOUND');
    }

    if (!storedToken.isValid()) {
      // Detectar possível roubo de token
      if (storedToken.familyId) {
        await this.revokeTokenFamily(storedToken.familyId);
      }
      throw new UnauthorizedError('Token inválido ou expirado - possível tentativa de roubo detectada', 'TOKEN_INVALID_OR_EXPIRED');
    }

    // Marcar como usado
    storedToken.markAsUsed();
    await this.tokenRepository.save(storedToken);

    return storedToken;
  }

  /**
   * Revoga um token específico
   */
  async revokeToken(token: string): Promise<void> {
    const tokenHash = TokenManager.hashToken(token);
    const resetToken = await this.tokenRepository.findByTokenHash(tokenHash);
    if (resetToken) {
      resetToken.isRevoked = true;
      await this.tokenRepository.save(resetToken);
    }
  }

  /**
   * Revoga todos os tokens de uma família (proteção contra roubo)
   */
  async revokeTokenFamily(familyId: string): Promise<void> {
    const tokens = await this.tokenRepository.getRepository().find({
      where: { familyId } as any
    });
    for (const token of tokens) {
      token.isRevoked = true;
      await this.tokenRepository.save(token);
    }
  }

  /**
   * Revoga todos os tokens de um usuário
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokens = await this.tokenRepository.findByUserId(userId);
    for (const token of tokens) {
      token.isRevoked = true;
      await this.tokenRepository.save(token);
    }
  }

  /**
   * Limita número de tokens ativos por usuário
   */
  async enforceTokenLimit(userId: string, maxTokens: number = 5): Promise<void> {
    const userTokens = await this.tokenRepository.findByUserId(userId);
    const activeTokens = userTokens.filter(t => !t.isRevoked).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Se exceder limite, revogar os mais antigos
    if (activeTokens.length > maxTokens) {
      const tokensToRevoke = activeTokens.slice(maxTokens);
      
      // Revogar cada token individualmente
      for (const token of tokensToRevoke) {
        token.isRevoked = true;
        await this.tokenRepository.save(token);
      }
    }
  }

  /**
   * Remove tokens expirados do banco (limpeza periódica)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.tokenRepository.getRepository().delete({
      expiresAt: LessThan(new Date())
    });

    return result.affected || 0;
  }

  /**
   * Remove tokens revogados antigos (mais de 30 dias)
   */
  async cleanupRevokedTokens(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.tokenRepository.getRepository().delete({
      isRevoked: true,
      createdAt: LessThan(cutoffDate)
    });

    return result.affected || 0;
  }

  /**
   * Obtém estatísticas de tokens
   */
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

