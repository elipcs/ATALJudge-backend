import { BaseRepository } from './BaseRepository';
import { Submission } from '../models/Submission';
import { SubmissionStatus } from '../enums';

/**
 * Repositório de submissões
 */
export class SubmissionRepository extends BaseRepository<Submission> {
  constructor() {
    super(Submission);
  }

  /**
   * Busca submissões de um usuário
   */
  async findByUser(userId: string): Promise<Submission[]> {
    return this.repository.find({
      where: { userId },
      relations: ['question'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Busca submissões de uma questão
   */
  async findByQuestion(questionId: string): Promise<Submission[]> {
    return this.repository.find({
      where: { questionId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Busca submissões de um usuário em uma questão
   */
  async findByUserAndQuestion(userId: string, questionId: string): Promise<Submission[]> {
    return this.repository.find({
      where: { userId, questionId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Busca submissão com resultados
   */
  async findWithResults(id: string): Promise<Submission | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['results', 'results.testCase', 'question', 'user']
    });
  }

  /**
   * Busca submissões por status
   */
  async findByStatus(status: SubmissionStatus): Promise<Submission[]> {
    return this.repository.find({
      where: { status },
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Conta submissões aceitas de um usuário
   */
  async countAcceptedByUser(userId: string): Promise<number> {
    return this.repository.count({
      where: {
        userId,
        score: 100
      } as any
    });
  }

  /**
   * Busca submissões com filtros
   */
  async findByFilters(filters: {
    questionId?: string;
    userId?: string;
    status?: SubmissionStatus;
    limit?: number;
  }): Promise<Submission[]> {
    const queryBuilder = this.repository.createQueryBuilder('submission');

    if (filters.questionId) {
      queryBuilder.andWhere('submission.questionId = :questionId', { questionId: filters.questionId });
    }

    if (filters.userId) {
      queryBuilder.andWhere('submission.userId = :userId', { userId: filters.userId });
    }

    if (filters.status) {
      queryBuilder.andWhere('submission.status = :status', { status: filters.status });
    }

    queryBuilder.orderBy('submission.createdAt', 'DESC');

    if (filters.limit) {
      queryBuilder.take(filters.limit);
    }

    return queryBuilder.getMany();
  }
}

