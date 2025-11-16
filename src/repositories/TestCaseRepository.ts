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

  async countByQuestion(questionId: string): Promise<number> {
    return this.repository.count({ where: { questionId } });
  }

  async deleteByQuestion(questionId: string): Promise<number> {
    const result = await this.repository.delete({ questionId });
    return result.affected || 0;
  }

  /**
   * Find test case by question ID and input/output combination
   * Used to check for duplicates
   */
  async findByInputOutput(questionId: string, input: string, expectedOutput: string, excludeId?: string): Promise<TestCase | null> {
    const query = this.repository.createQueryBuilder('tc')
      .where('tc.questionId = :questionId', { questionId })
      .andWhere('tc.input = :input', { input })
      .andWhere('tc.expectedOutput = :expectedOutput', { expectedOutput });
    
    // Exclude the current test case when updating
    if (excludeId) {
      query.andWhere('tc.id != :excludeId', { excludeId });
    }
    
    return query.getOne() || null;
  }
}

