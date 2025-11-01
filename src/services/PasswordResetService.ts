import { PasswordResetTokenRepository } from '../repositories/PasswordResetTokenRepository';
import { PasswordResetToken } from '../models/PasswordResetToken';
import * as crypto from 'crypto';

/**
 * Service para gerenciar tokens de reset de senha
 */
export class PasswordResetService {
  private tokenRepository: PasswordResetTokenRepository;

  constructor(tokenRepository: PasswordResetTokenRepository) {
    this.tokenRepository = tokenRepository;
  }

  /**
   * Gera e salva um novo token de reset de senha
   * Retorna o token não hasheado para enviar por email
   */
  async createResetToken(userId: string, expirationHours: number = 1): Promise<string> {
    // Gerar token seguro de 32 bytes
    const token = crypto.randomBytes(32).toString('hex');
    
    // Criar entidade
    const resetToken = new PasswordResetToken();
    resetToken.userId = userId;
    resetToken.setToken(token);
    resetToken.expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    resetToken.isUsed = false;

    // Salvar no banco
    await this.tokenRepository.create(resetToken);

    // Retornar token não hasheado para enviar por email
    return token;
  }

  /**
   * Valida e retorna o token se for válido
   */
  async validateToken(token: string): Promise<PasswordResetToken | null> {
    // Hash do token fornecido
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar token no banco
    const resetToken = await this.tokenRepository.findValidToken(tokenHash);

    return resetToken;
  }

  /**
   * Marca token como usado
   */
  async markTokenAsUsed(token: PasswordResetToken): Promise<void> {
    token.markAsUsed();
    await this.tokenRepository.save(token);
  }

  /**
   * Remove token após uso bem-sucedido
   */
  async revokeToken(token: PasswordResetToken): Promise<void> {
    await this.tokenRepository.delete(token.id);
  }

  /**
   * Remove todos os tokens ativos de um usuário
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepository.deleteByUserId(userId);
  }

  /**
   * Remove tokens expirados (limpeza periódica)
   */
  async cleanupExpiredTokens(): Promise<number> {
    return this.tokenRepository.deleteExpired();
  }
}

