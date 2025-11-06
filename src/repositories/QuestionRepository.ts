import { BaseRepository } from './BaseRepository';
import { Question } from '../models/Question';

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

  async findByAuthor(authorId: string): Promise<Question[]> {
    return this.repository.find({
      where: { authorId },
      relations: ['author', 'testCases']
    });
  }

  async findByJudgeType(judgeType: string): Promise<Question[]> {
    return this.repository.find({
      where: { judgeType } as any,
      relations: ['author']
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
}

