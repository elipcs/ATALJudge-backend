import { BaseRepository } from './BaseRepository';
import { RefreshToken } from '../models/RefreshToken';

/**
 * Repositório de refresh tokens
 */
export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor() {
    super(RefreshToken);
  }

  /**
   * Busca token por hash
   */
  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repository.findOne({ where: { tokenHash } });
  }

  /**
   * Busca tokens de um usuário
   */
  async findByUserId(userId: string): Promise<RefreshToken[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Remove todos os tokens de um usuário
   */
  async deleteByUserId(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }

  /**
   * Remove tokens expirados
   */
  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(RefreshToken)
      .where('expiresAt < :now', { now })
      .execute();

    return result.affected || 0;
  }
}


