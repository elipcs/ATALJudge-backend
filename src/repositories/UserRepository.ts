import { injectable } from 'tsyringe';
import { BaseRepository } from './BaseRepository';
import { User } from '../models/User';

@injectable()
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email: email.toLowerCase() } });
  }

  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email: email.toLowerCase() } as any);
  }

  async findByRole(role: string): Promise<User[]> {
    return this.repository.find({ 
      where: { role } as any,
      relations: ['class']
    });
  }

  async findAll(): Promise<User[]> {
    return this.repository.find({ relations: ['class'] });
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ 
      where: { id } as any,
      relations: ['class']
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.repository.update(userId, { lastLogin: new Date() } as any);
  }
}

