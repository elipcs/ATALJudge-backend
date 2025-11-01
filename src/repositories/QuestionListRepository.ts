import { BaseRepository } from './BaseRepository';
import { QuestionList } from '../models/QuestionList';
import { Question } from '../models/Question';
import { Class } from '../models/Class';

/**
 * Repositório de listas de questões
 */
export class QuestionListRepository extends BaseRepository<QuestionList> {
  constructor() {
    super(QuestionList);
  }

  /**
   * Busca lista por ID com relações
   */
  async findByIdWithRelations(
    id: string,
    includeQuestions: boolean = false,
    includeClasses: boolean = false,
    includeAuthor: boolean = false
  ): Promise<QuestionList | null> {
    const queryBuilder = this.repository
      .createQueryBuilder('list')
      .where('list.id = :id', { id });

    if (includeAuthor) {
      queryBuilder.leftJoinAndSelect('list.author', 'author');
    }

    if (includeQuestions) {
      queryBuilder.leftJoinAndSelect('list.questions', 'questions');
    }

    if (includeClasses) {
      queryBuilder.leftJoinAndSelect('list.classes', 'classes');
    }

    return queryBuilder.getOne();
  }

  /**
   * Busca todas as listas com relações
   */
  async findAllWithRelations(
    includeQuestions: boolean = false,
    includeClasses: boolean = false,
    includeAuthor: boolean = false
  ): Promise<QuestionList[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('list')
      .orderBy('list.createdAt', 'DESC');

    if (includeAuthor) {
      queryBuilder.leftJoinAndSelect('list.author', 'author');
    }

    if (includeQuestions) {
      queryBuilder.leftJoinAndSelect('list.questions', 'questions');
    }

    if (includeClasses) {
      queryBuilder.leftJoinAndSelect('list.classes', 'classes');
    }

    return queryBuilder.getMany();
  }

  /**
   * Busca listas de um autor
   */
  async findByAuthor(authorId: string): Promise<QuestionList[]> {
    return this.repository.find({
      where: { authorId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Busca listas de uma turma
   */
  async findByClass(classId: string): Promise<QuestionList[]> {
    return this.repository
      .createQueryBuilder('list')
      .innerJoin('list.classes', 'class', 'class.id = :classId', { classId })
      .orderBy('list.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Busca listas abertas (dentro do período)
   */
  async findOpenLists(): Promise<QuestionList[]> {
    const now = new Date();
    return this.repository
      .createQueryBuilder('list')
      .where('list.startDate <= :now', { now })
      .andWhere('list.endDate >= :now', { now })
      .orderBy('list.endDate', 'ASC')
      .getMany();
  }

  /**
   * Busca listas futuras (ainda não abertas)
   */
  async findFutureLists(): Promise<QuestionList[]> {
    const now = new Date();
    return this.repository
      .createQueryBuilder('list')
      .where('list.startDate > :now', { now })
      .orderBy('list.startDate', 'ASC')
      .getMany();
  }

  /**
   * Adiciona questão à lista
   */
  async addQuestion(listId: string, question: Question): Promise<void> {
    const list = await this.findByIdWithRelations(listId, true);
    if (!list) {
      throw new Error('Lista não encontrada');
    }

    if (!list.questions) {
      list.questions = [];
    }

    // Verifica se questão já está na lista
    const isAlreadyAdded = list.questions.some(q => q.id === question.id);
    if (!isAlreadyAdded) {
      list.questions.push(question);
      await this.repository.save(list);
    }
  }

  /**
   * Remove questão da lista
   */
  async removeQuestion(listId: string, questionId: string): Promise<void> {
    const list = await this.findByIdWithRelations(listId, true);
    if (!list) {
      throw new Error('Lista não encontrada');
    }

    if (list.questions) {
      list.questions = list.questions.filter(q => q.id !== questionId);
      await this.repository.save(list);
    }
  }

  /**
   * Adiciona turma à lista
   */
  async addClass(listId: string, classEntity: Class): Promise<void> {
    const list = await this.findByIdWithRelations(listId, false, true);
    if (!list) {
      throw new Error('Lista não encontrada');
    }

    if (!list.classes) {
      list.classes = [];
    }

    // Verifica se turma já está associada à lista
    const isAlreadyAdded = list.classes.some(c => c.id === classEntity.id);
    if (!isAlreadyAdded) {
      list.classes.push(classEntity);
      await this.repository.save(list);
    }
  }

  /**
   * Remove turma da lista
   */
  async removeClass(listId: string, classId: string): Promise<void> {
    const list = await this.findByIdWithRelations(listId, false, true);
    if (!list) {
      throw new Error('Lista não encontrada');
    }

    if (list.classes) {
      list.classes = list.classes.filter(c => c.id !== classId);
      await this.repository.save(list);
    }
  }

  /**
   * Busca questões de uma lista
   */
  async findQuestions(listId: string): Promise<Question[]> {
    const list = await this.findByIdWithRelations(listId, true);
    return list?.questions || [];
  }

  /**
   * Busca turmas de uma lista
   */
  async findClasses(listId: string): Promise<Class[]> {
    const list = await this.findByIdWithRelations(listId, false, true);
    return list?.classes || [];
  }
}


