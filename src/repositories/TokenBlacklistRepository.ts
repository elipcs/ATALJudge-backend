import { injectable } from 'tsyringe';
import { BaseRepository } from './BaseRepository';
import { TokenBlacklist } from '../models/TokenBlacklist';

@injectable()
export class TokenBlacklistRepository extends BaseRepository<TokenBlacklist> {
  constructor() {
    super(TokenBlacklist);
  }

  async findByToken(token: string): Promise<TokenBlacklist | null> {
    return this.repository.findOne({ where: { token } });
  }

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

