import { injectable } from 'tsyringe';
import { LessThan } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { RefreshToken } from '../models/RefreshToken';

@injectable()
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

  async findByFamilyId(familyId: string): Promise<RefreshToken[]> {
    return this.repository.find({
      where: { familyId }
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

  async deleteExpiredTokens(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date())
    });
    return result.affected || 0;
  }

  async deleteRevokedTokens(cutoffDate: Date): Promise<number> {
    const result = await this.repository.delete({
      isRevoked: true,
      createdAt: LessThan(cutoffDate)
    });
    return result.affected || 0;
  }
}

