import { injectable } from 'tsyringe';
import { BaseRepository } from './BaseRepository';
import { Submission } from '../models/Submission';
import { SubmissionStatus } from '../enums';

@injectable()
export class SubmissionRepository extends BaseRepository<Submission> {
  constructor() {
    super(Submission);
  }

  async findByUser(userId: string): Promise<Submission[]> {
    return this.repository.find({
      where: { userId },
      relations: ['question'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByQuestion(questionId: string): Promise<Submission[]> {
    return this.repository.find({
      where: { questionId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByUserAndQuestion(userId: string, questionId: string): Promise<Submission[]> {
    return this.repository.find({
      where: { userId, questionId },
      order: { createdAt: 'DESC' }
    });
  }

  async findWithResults(id: string): Promise<Submission | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['results', 'results.testCase', 'question', 'user']
    });
  }

  async findByStatus(status: SubmissionStatus): Promise<Submission[]> {
    return this.repository.find({
      where: { status },
      order: { createdAt: 'ASC' }
    });
  }

  async countAcceptedByUser(userId: string): Promise<number> {
    return this.repository.count({
      where: {
        userId,
        score: 100
      } as any
    });
  }

  async findByFilters(filters: {
    questionId?: string;
    userId?: string;
    status?: SubmissionStatus;
    verdict?: string;
    page: number;
    limit: number;
  }): Promise<{ submissions: Submission[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.user', 'user')
      .leftJoinAndSelect('submission.question', 'question')
      .leftJoinAndSelect('question.questionLists', 'questionList');

    if (filters.questionId) {
      queryBuilder.andWhere('submission.questionId = :questionId', { questionId: filters.questionId });
    }

    if (filters.userId) {
      queryBuilder.andWhere('submission.userId = :userId', { userId: filters.userId });
    }

    if (filters.status) {
      queryBuilder.andWhere('submission.status = :status', { status: filters.status });
    }

    if (filters.verdict) {
      if (filters.verdict.toLowerCase() === 'failed') {
        queryBuilder.andWhere('(submission.verdict IS NULL OR submission.verdict != :accepted)', { accepted: 'Accepted' });
      } else if (filters.verdict.toLowerCase() === 'accepted') {
        queryBuilder.andWhere('submission.verdict = :verdict', { verdict: 'Accepted' });
      } else {
        queryBuilder.andWhere('submission.verdict = :verdict', { verdict: filters.verdict });
      }
    }

    queryBuilder.orderBy('submission.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const submissions = await queryBuilder.getMany();

    return { submissions, total };
  }

  /**
   * Find submission by ID with associated question list information
   */
  async findByIdWithListInfo(id: string): Promise<Submission | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user', 'question', 'question.questionLists']
    });
  }

  /**
   * Search submissions globally by question, list, student, or language
   */
  async searchGlobal(
    searchTerm: string,
    filters?: {
      verdict?: string;
      status?: SubmissionStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{ submissions: any[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.user', 'user')
      .leftJoinAndSelect('submission.question', 'question')
      .leftJoinAndSelect('question.questionLists', 'questionList');

    // Buscar por título da questão, nome da lista, nome do estudante ou linguagem
    const searchLower = `%${searchTerm.toLowerCase()}%`;
    queryBuilder.where(
      'LOWER(question.title) LIKE LOWER(:searchTerm) OR ' +
      'LOWER(questionList.title) LIKE LOWER(:searchTerm) OR ' +
      'LOWER(user.name) LIKE LOWER(:searchTerm) OR ' +
      'LOWER(submission.language) LIKE LOWER(:searchTerm)',
      { searchTerm: searchLower }
    );

    if (filters?.verdict) {
      if (filters.verdict.toLowerCase() === 'failed') {
        queryBuilder.andWhere('(submission.verdict IS NULL OR submission.verdict != :accepted)', { accepted: 'Accepted' });
      } else if (filters.verdict.toLowerCase() === 'accepted') {
        queryBuilder.andWhere('submission.verdict = :verdict', { verdict: 'Accepted' });
      } else {
        queryBuilder.andWhere('submission.verdict = :verdict', { verdict: filters.verdict });
      }
    }

    if (filters?.status) {
      queryBuilder.andWhere('submission.status = :status', { status: filters.status });
    }

    queryBuilder.orderBy('submission.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const submissions = await queryBuilder.getMany();

    return { submissions, total };
  }
}
