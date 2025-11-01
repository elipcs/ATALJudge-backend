import { BaseRepository } from './BaseRepository';
import { PasswordResetToken } from '../models/PasswordResetToken';

/**
 * Repositório de tokens de reset de senha
 */
export class PasswordResetTokenRepository extends BaseRepository<PasswordResetToken> {
  constructor() {
    super(PasswordResetToken);
  }

  /**
   * Busca token por hash
   */
  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.repository.findOne({ where: { tokenHash } });
  }

  /**
   * Busca tokens ativos de um usuário
   */
  async findActiveByUserId(userId: string): Promise<PasswordResetToken[]> {
    return this.repository
      .createQueryBuilder('token')
      .where('token.userId = :userId', { userId })
      .andWhere('token.isUsed = :isUsed', { isUsed: false })
      .andWhere('token.expiresAt > :now', { now: new Date() })
      .orderBy('token.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Busca token válido por hash de token
   */
  async findValidToken(tokenHash: string): Promise<PasswordResetToken | null> {
    const token = await this.repository.findOne({
      where: { tokenHash },
      relations: ['user']
    });

    if (!token || !token.isValid()) {
      return null;
    }

    return token;
  }

  /**
   * Remove tokens expirados
   */
  async deleteExpired(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(PasswordResetToken)
      .where('expires_at < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  /**
   * Remove todos os tokens de um usuário
   */
  async deleteByUserId(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }
}

