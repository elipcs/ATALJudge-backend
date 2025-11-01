import { BaseRepository } from './BaseRepository';
import { User } from '../models/User';

/**
 * Repositório de usuários
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  /**
   * Busca usuário por email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email: email.toLowerCase() } });
  }

  /**
   * Verifica se email já está em uso
   */
  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email: email.toLowerCase() } as any);
  }

  /**
   * Busca usuários por papel
   */
  async findByRole(role: string): Promise<User[]> {
    return this.repository.find({ where: { role } as any });
  }

  /**
   * Atualiza último login
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.repository.update(userId, { lastLogin: new Date() } as any);
  }
}

