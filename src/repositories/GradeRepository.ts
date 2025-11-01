import { AppDataSource } from '../config/database';
import { Grade } from '../models';
import { Repository } from 'typeorm';

/**
 * Repository para gerenciamento de notas
 */
export class GradeRepository {
  private repository: Repository<Grade>;

  constructor() {
    this.repository = AppDataSource.getRepository(Grade);
  }

  /**
   * Busca nota por ID
   */
  async findById(id: string): Promise<Grade | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['student', 'list']
    });
  }

  /**
   * Busca nota de um estudante em uma lista
   */
  async findByStudentAndList(studentId: string, listId: string): Promise<Grade | null> {
    return this.repository.findOne({
      where: { studentId, listId },
      relations: ['student', 'list']
    });
  }

  /**
   * Busca todas as notas de um estudante
   */
  async findByStudent(studentId: string): Promise<Grade[]> {
    return this.repository.find({
      where: { studentId },
      relations: ['list'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Busca todas as notas de uma lista
   */
  async findByList(listId: string): Promise<Grade[]> {
    return this.repository.find({
      where: { listId },
      relations: ['student'],
      order: { score: 'DESC' }
    });
  }

  /**
   * Cria uma nova nota
   */
  async create(grade: Partial<Grade>): Promise<Grade> {
    const newGrade = this.repository.create(grade);
    return this.repository.save(newGrade);
  }

  /**
   * Atualiza uma nota
   */
  async update(id: string, data: Partial<Grade>): Promise<Grade | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  /**
   * Deleta uma nota
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Deleta todas as notas de um estudante
   */
  async deleteByStudent(studentId: string): Promise<void> {
    await this.repository.delete({ studentId });
  }

  /**
   * Deleta todas as notas de uma lista
   */
  async deleteByList(listId: string): Promise<void> {
    await this.repository.delete({ listId });
  }
}

