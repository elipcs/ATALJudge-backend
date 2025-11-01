import { BaseRepository } from './BaseRepository';
import { TokenBlacklist } from '../models/TokenBlacklist';

/**
 * Repositório de tokens na blacklist
 */
export class TokenBlacklistRepository extends BaseRepository<TokenBlacklist> {
  constructor() {
    super(TokenBlacklist);
  }

  /**
   * Busca token na blacklist
   */
  async findByToken(token: string): Promise<TokenBlacklist | null> {
    return this.repository.findOne({ where: { token } });
  }

  /**
   * Remove tokens expirados da blacklist
   */
  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(TokenBlacklist)
      .where('expiresAt < :now', { now })
      .execute();

    return result.affected || 0;
  }
}


