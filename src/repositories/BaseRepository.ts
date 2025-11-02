import { Repository, FindOptionsWhere, DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database';

export class BaseRepository<T extends { id: string }> {
  protected repository: Repository<T>;

  constructor(entity: new () => T) {
    this.repository = AppDataSource.getRepository(entity);
  }

  getRepository(): Repository<T> {
    return this.repository;
  }

  async save(entity: DeepPartial<T>): Promise<T> {
    return this.repository.save(entity as any);
  }

  async remove(entity: T): Promise<T> {
    return this.repository.remove(entity);
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  async findOne(criteria: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where: criteria });
  }

  async find(criteria: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.find({ where: criteria });
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async count(criteria?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where: criteria });
  }

  async exists(criteria: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where: criteria });
    return count > 0;
  }
}

