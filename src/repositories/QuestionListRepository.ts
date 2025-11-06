import { injectable } from 'tsyringe';
import { SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { QuestionList } from '../models/QuestionList';
import { Question } from '../models/Question';
import { Class } from '../models/Class';

@injectable()
export class QuestionListRepository extends BaseRepository<QuestionList> {
  constructor() {
    super(QuestionList);
  }

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

  createQueryBuilder(alias: string): SelectQueryBuilder<QuestionList> {
    return this.repository.createQueryBuilder(alias);
  }

  async saveWithRelations(list: QuestionList): Promise<QuestionList> {
    return this.repository.save(list);
  }

  async findByAuthor(authorId: string): Promise<QuestionList[]> {
    return this.repository.find({
      where: { authorId },
      order: { createdAt: 'DESC' }
    });
  }

  async findByClass(classId: string): Promise<QuestionList[]> {
    return this.repository
      .createQueryBuilder('list')
      .innerJoin('list.classes', 'class', 'class.id = :classId', { classId })
      .orderBy('list.createdAt', 'DESC')
      .getMany();
  }

  async findOpenLists(): Promise<QuestionList[]> {
    const now = new Date();
    return this.repository
      .createQueryBuilder('list')
      .where('list.startDate <= :now', { now })
      .andWhere('list.endDate >= :now', { now })
      .orderBy('list.endDate', 'ASC')
      .getMany();
  }

  async findFutureLists(): Promise<QuestionList[]> {
    const now = new Date();
    return this.repository
      .createQueryBuilder('list')
      .where('list.startDate > :now', { now })
      .orderBy('list.startDate', 'ASC')
      .getMany();
  }

  async addQuestion(listId: string, question: Question): Promise<void> {
    const list = await this.findByIdWithRelations(listId, true);
    if (!list) {
      throw new Error('Lista não encontrada');
    }

    if (!list.questions) {
      list.questions = [];
    }

    const isAlreadyAdded = list.questions.some(q => q.id === question.id);
    if (!isAlreadyAdded) {
      list.questions.push(question);
      await this.repository.save(list);
    }
  }

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

  async addClass(listId: string, classEntity: Class): Promise<void> {
    const list = await this.findByIdWithRelations(listId, false, true);
    if (!list) {
      throw new Error('Lista não encontrada');
    }

    if (!list.classes) {
      list.classes = [];
    }

    const isAlreadyAdded = list.classes.some(c => c.id === classEntity.id);
    if (!isAlreadyAdded) {
      list.classes.push(classEntity);
      await this.repository.save(list);
    }
  }

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

  async findQuestions(listId: string): Promise<Question[]> {
    const list = await this.findByIdWithRelations(listId, true);
    return list?.questions || [];
  }

  async findClasses(listId: string): Promise<Class[]> {
    const list = await this.findByIdWithRelations(listId, false, true);
    return list?.classes || [];
  }

  async findByQuestionId(questionId: string): Promise<QuestionList | null> {
    return this.repository
      .createQueryBuilder('list')
      .innerJoin('list.questions', 'question', 'question.id = :questionId', { questionId })
      .getOne();
  }
}

