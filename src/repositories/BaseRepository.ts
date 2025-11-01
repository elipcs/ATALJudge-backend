import { Repository, FindOptionsWhere, DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database';

/**
 * Repositório base genérico
 */
export class BaseRepository<T extends { id: string }> {
  protected repository: Repository<T>;

  constructor(entity: new () => T) {
    this.repository = AppDataSource.getRepository(entity);
  }

  /**
   * Retorna o repository do TypeORM para operações avançadas
   */
  getRepository(): Repository<T> {
    return this.repository;
  }

  /**
   * Salva uma entidade (compatibilidade com TypeORM)
   */
  async save(entity: DeepPartial<T>): Promise<T> {
    return this.repository.save(entity as any);
  }

  /**
   * Remove uma entidade (compatibilidade com TypeORM)
   */
  async remove(entity: T): Promise<T> {
    return this.repository.remove(entity);
  }

  /**
   * Busca todos os registros
   */
  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  /**
   * Busca um registro por ID
   */
  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  /**
   * Busca um registro por critérios
   */
  async findOne(criteria: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where: criteria });
  }

  /**
   * Busca múltiplos registros por critérios
   */
  async find(criteria: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.find({ where: criteria });
  }

  /**
   * Cria um novo registro
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Atualiza um registro
   */
  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  /**
   * Remove um registro
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  /**
   * Conta registros
   */
  async count(criteria?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where: criteria });
  }

  /**
   * Verifica se existe um registro
   */
  async exists(criteria: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where: criteria });
    return count > 0;
  }
}

