import { BaseRepository } from './BaseRepository';
import { RefreshToken } from '../models/RefreshToken';

export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor() {
    super(RefreshToken);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repository.findOne({ where: { tokenHash } });
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }

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

