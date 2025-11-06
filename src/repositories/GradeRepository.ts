import { BaseRepository } from './BaseRepository';
import { Grade } from '../models';

export class GradeRepository extends BaseRepository<Grade> {
  constructor() {
    super(Grade);
  }

  async findById(id: string): Promise<Grade | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['student', 'list']
    });
  }

  async findByStudentAndList(studentId: string, listId: string): Promise<Grade | null> {
    return this.repository.findOne({
      where: { studentId, listId },
      relations: ['student', 'list']
    });
  }

  async findByStudent(studentId: string): Promise<Grade[]> {
    return this.repository.find({
      where: { studentId },
      relations: ['list'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByList(listId: string): Promise<Grade[]> {
    return this.repository.find({
      where: { listId },
      relations: ['student'],
      order: { score: 'DESC' }
    });
  }

  async create(grade: Partial<Grade>): Promise<Grade> {
    const newGrade = this.repository.create(grade);
    return this.repository.save(newGrade);
  }

  async update(id: string, data: Partial<Grade>): Promise<Grade | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async deleteByStudent(studentId: string): Promise<number> {
    const result = await this.repository.delete({ studentId });
    return result.affected || 0;
  }

  async deleteByList(listId: string): Promise<number> {
    const result = await this.repository.delete({ listId });
    return result.affected || 0;
  }
}

