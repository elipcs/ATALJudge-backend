import { BaseRepository } from './BaseRepository';
import { Question } from '../models/Question';
import { AppDataSource } from '../config/database';

/**
 * Repositório de questões
 */
export class QuestionRepository extends BaseRepository<Question> {
  constructor() {
    // Question é abstrato, usar getRepository diretamente
    super(Question as any);
    // Sobrescrever repository para usar AppDataSource diretamente
    this.repository = AppDataSource.getRepository(Question);
  }

  /**
   * Busca todas as questões com author
   */
  async findAll(): Promise<Question[]> {
    return this.repository.find({
      relations: ['author']
    });
  }

  /**
   * Busca questão por ID com relações
   */
  async findById(id: string): Promise<Question | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['author', 'testCases']
    });
  }

  /**
   * Busca questões por autor
   */
  async findByAuthor(authorId: string): Promise<Question[]> {
    return this.repository.find({
      where: { authorId },
      relations: ['author', 'testCases']
    });
  }

  /**
   * Busca questões por tipo de judge
   */
  async findByJudgeType(judgeType: string): Promise<Question[]> {
    return this.repository.find({
      where: { judgeType } as any,
      relations: ['author']
    });
  }

  /**
   * Busca questão com casos de teste
   */
  async findWithTestCases(id: string): Promise<Question | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['testCases']
    });
  }

  /**
   * Busca questões por tags
   */
  async findByTags(tags: string[]): Promise<Question[]> {
    return this.repository
      .createQueryBuilder('question')
      .where('question.tags && :tags', { tags })
      .getMany();
  }
}

