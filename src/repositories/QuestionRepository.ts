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
      relations: ['author'],
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async findById(id: string): Promise<Question | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['author', 'testCases']
    });
  }

  async findByAuthor(
    authorId: string,
    filters?: { source?: string; tags?: string[] },
    skip?: number,
    take?: number
  ): Promise<[Question[], number]> {
    const query = this.repository.createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.testCases', 'testCases')
      .where('question.authorId = :authorId', { authorId });

    if (filters?.source) {
      query.andWhere('question.source = :source', { source: filters.source });
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.andWhere("question.tags ?| array[:...tags]", { tags: filters.tags });
    }

    query.orderBy('question.createdAt', 'DESC');

    if (skip !== undefined) query.skip(skip);
    if (take !== undefined) query.take(take);

    return query.getManyAndCount();
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
      .leftJoinAndSelect('question.author', 'author')
      .where('LOWER(question.title) LIKE LOWER(:searchTerm)', { searchTerm: `%${searchTerm}%` })
      .orWhere('LOWER(question.source) LIKE LOWER(:searchTerm)', { searchTerm: `%${searchTerm}%` })
      .orWhere('question.tags IS NOT NULL AND LOWER(question.tags::text) LIKE LOWER(:tagsSearch)', { tagsSearch: `%${searchTerm}%` });

    query.orderBy('question.createdAt', 'DESC');

    if (skip !== undefined) query.skip(skip);
    if (take !== undefined) query.take(take);

    return query.getManyAndCount();
  }
}

