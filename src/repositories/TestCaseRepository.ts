import { BaseRepository } from './BaseRepository';
import { TestCase } from '../models/TestCase';

/**
 * Repositório de casos de teste
 */
export class TestCaseRepository extends BaseRepository<TestCase> {
  constructor() {
    super(TestCase);
  }

  /**
   * Busca casos de teste de uma questão
   */
  async findByQuestion(questionId: string): Promise<TestCase[]> {
    return this.repository.find({
      where: { questionId },
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Busca casos de teste de exemplo
   */
  async findSamplesByQuestion(questionId: string): Promise<TestCase[]> {
    return this.repository.find({
      where: { questionId, isSample: true},
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Conta casos de teste de uma questão
   */
  async countByQuestion(questionId: string): Promise<number> {
    return this.repository.count({ where: { questionId } });
  }

  /**
   * Remove todos os casos de teste de uma questão
   */
  async deleteByQuestion(questionId: string): Promise<number> {
    const result = await this.repository.delete({ questionId });
    return result.affected || 0;
  }
}

