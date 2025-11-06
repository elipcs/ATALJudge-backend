import { injectable } from 'tsyringe';
import { BaseRepository } from './BaseRepository';
import { Invite } from '../models/Invite';
import { LessThan } from 'typeorm';

@injectable()
export class InviteRepository extends BaseRepository<Invite> {
  constructor() {
    super(Invite);
  }

  async findByToken(token: string): Promise<Invite | null> {
    return this.repository.findOne({ where: { token } });
  }

  async findByCreator(createdById: string): Promise<Invite[]> {
    return this.repository.find({
      where: { createdById },
      order: { createdAt: 'DESC' }
    });
  }

  async incrementUse(id: string): Promise<void> {
    const invite = await this.findById(id);
    if (invite) {
      invite.incrementUses();
      await this.save(invite);
    }
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date()),
      isUsed: false
    });
    return result.affected || 0;
  }
}

