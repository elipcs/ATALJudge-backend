import { injectable } from 'tsyringe';
import { BaseRepository } from './BaseRepository';
import { Grade } from '../models';

@injectable()
export class GradeRepository extends BaseRepository<Grade> {
  constructor() {
    super(Grade);
  }

  async findById(id: string): Promise<Grade | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['student', 'questionList']
    });
  }

  async findByStudentAndList(studentId: string, questionListId: string): Promise<Grade | null> {
    return this.repository.findOne({
      where: { studentId, questionListId },
      relations: ['student', 'questionList']
    });
  }

  async findByStudent(studentId: string): Promise<Grade[]> {
    return this.repository.find({
      where: { studentId },
      relations: ['questionList'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByList(questionListId: string): Promise<Grade[]> {
    return this.repository.find({
      where: { questionListId },
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

  async deleteByList(questionListId: string): Promise<number> {
    const result = await this.repository.delete({ questionListId });
    return result.affected || 0;
  }
}

