import { injectable } from 'tsyringe';
import { BaseRepository } from './BaseRepository';
import { Question } from '../models/Question';

@injectable()
export class QuestionRepository extends BaseRepository<Question> {
  constructor() {
    super(Question);
  }

  async findAll(): Promise<Question[]> {
    return this.repository.find({
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async findById(id: string): Promise<Question | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['testCases']
    });
  }
  
  async findWithTestCases(id: string): Promise<Question | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['testCases']
    });
  }

  async findByTags(tags: string[]): Promise<Question[]> {
    return this.repository
      .createQueryBuilder('question')
      .where('question.tags && :tags', { tags })
      .getMany();
  }

  async searchGlobal(
    searchTerm: string,
    skip?: number,
    take?: number
  ): Promise<[Question[], number]> {
    const query = this.repository.createQueryBuilder('question')
      .where('LOWER(question.title) LIKE LOWER(:searchTerm)', { searchTerm: `%${searchTerm}%` })
      .orWhere('LOWER(question.source) LIKE LOWER(:searchTerm)', { searchTerm: `%${searchTerm}%` })
      .orWhere('question.tags IS NOT NULL AND LOWER(question.tags::text) LIKE LOWER(:tagsSearch)', { tagsSearch: `%${searchTerm}%` });

    query.orderBy('question.createdAt', 'DESC');

    if (skip !== undefined) query.skip(skip);
    if (take !== undefined) query.take(take);

    return query.getManyAndCount();
  }
}

