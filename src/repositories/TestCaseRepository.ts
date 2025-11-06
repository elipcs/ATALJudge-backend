import { injectable } from 'tsyringe';
import { BaseRepository } from './BaseRepository';
import { TestCase } from '../models/TestCase';

@injectable()
export class TestCaseRepository extends BaseRepository<TestCase> {
  constructor() {
    super(TestCase);
  }

  async findByQuestion(questionId: string): Promise<TestCase[]> {
    return this.repository.find({
      where: { questionId },
      order: { createdAt: 'ASC' }
    });
  }

  async findSamplesByQuestion(questionId: string): Promise<TestCase[]> {
    return this.repository.find({
      where: { questionId, isSample: true},
      order: { createdAt: 'ASC' }
    });
  }

  async countByQuestion(questionId: string): Promise<number> {
    return this.repository.count({ where: { questionId } });
  }

  async deleteByQuestion(questionId: string): Promise<number> {
    const result = await this.repository.delete({ questionId });
    return result.affected || 0;
  }
}

