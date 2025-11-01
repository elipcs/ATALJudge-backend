import { BaseRepository } from './BaseRepository';
import { Invite } from '../models/Invite';
import { LessThan } from 'typeorm';

/**
 * Repositório de convites
 */
export class InviteRepository extends BaseRepository<Invite> {
  constructor() {
    super(Invite);
  }

  /**
   * Busca convite por token
   */
  async findByToken(token: string): Promise<Invite | null> {
    return this.repository.findOne({ where: { token } });
  }


  /**
   * Busca convites criados por um usuário
   */
  async findByCreator(createdById: string): Promise<Invite[]> {
    return this.repository.find({
      where: { createdById },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Incrementa o uso de um convite
   */
  async incrementUse(id: string): Promise<void> {
    const invite = await this.findById(id);
    if (invite) {
      invite.incrementUses();
      await this.update(id, invite);
    }
  }

  /**
   * Remove convites expirados
   */
  async deleteExpired(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date()),
      isUsed: false
    });
    return result.affected || 0;
  }
}

