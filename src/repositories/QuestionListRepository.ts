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
  ): Promise<QuestionList | null> {
    const queryBuilder = this.repository
      .createQueryBuilder('question_list')
      .where('question_list.id = :id', { id });

    if (includeQuestions) {
      queryBuilder.leftJoinAndSelect('question_list.questions', 'questions');
    }

    if (includeClasses) {
      queryBuilder.leftJoinAndSelect('question_list.classes', 'classes');
    }

    return queryBuilder.getOne();
  }

  async findAllWithRelations(
    includeQuestions: boolean = false,
    includeClasses: boolean = false,
  ): Promise<QuestionList[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('question_list')
      .orderBy('question_list.createdAt', 'DESC');

    if (includeQuestions) {
      queryBuilder.leftJoinAndSelect('question_list.questions', 'questions');
    }

    if (includeClasses) {
      queryBuilder.leftJoinAndSelect('question_list.classes', 'classes');
    }

    return queryBuilder.getMany();
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<QuestionList> {
    return this.repository.createQueryBuilder(alias);
  }

  async saveWithRelations(questionList: QuestionList): Promise<QuestionList> {
    return this.repository.save(questionList);
  }

  async findByClass(classId: string): Promise<QuestionList[]> {
    return this.repository
      .createQueryBuilder('question_list')
      .innerJoin('question_list.classes', 'class', 'class.id = :classId', { classId })
      .orderBy('question_list.createdAt', 'DESC')
      .getMany();
  }

  async findOpenLists(): Promise<QuestionList[]> {
    const now = new Date();
    return this.repository
      .createQueryBuilder('question_list')
      .where('question_list.startDate <= :now', { now })
      .andWhere('question_list.endDate >= :now', { now })
      .orderBy('question_list.endDate', 'ASC')
      .getMany();
  }

  async findFutureLists(): Promise<QuestionList[]> {
    const now = new Date();
    return this.repository
      .createQueryBuilder('question_list')
      .where('question_list.startDate > :now', { now })
      .orderBy('question_list.startDate', 'ASC')
      .getMany();
  }

  async addQuestion(questionListId: string, question: Question): Promise<void> {
    const questionList = await this.findByIdWithRelations(questionListId, true);
    if (!questionList) {
      throw new Error('Lista não encontrada');
    }

    if (!questionList.questions) {
      questionList.questions = [];
    }

    const isAlreadyAdded = questionList.questions.some(q => q.id === question.id);
    if (!isAlreadyAdded) {
      questionList.questions.push(question);
      await this.repository.save(questionList);
    }
  }

  async removeQuestion(questionListId: string, questionId: string): Promise<void> {
    const questionList = await this.findByIdWithRelations(questionListId, true);
    if (!questionList) {
      throw new Error('Lista não encontrada');
    }

    if (questionList.questions) {
      questionList.questions = questionList.questions.filter(q => q.id !== questionId);
      await this.repository.save(questionList);
    }
  }

  async addClass(questionListId: string, classEntity: Class): Promise<void> {
    const questionList = await this.findByIdWithRelations(questionListId, false, true);
    if (!questionList) {
      throw new Error('Lista não encontrada');
    }

    if (!questionList.classes) {
      questionList.classes = [];
    }

    const isAlreadyAdded = questionList.classes.some(c => c.id === classEntity.id);
    if (!isAlreadyAdded) {
      questionList.classes.push(classEntity);
      await this.repository.save(questionList);
    }
  }

  async removeClass(questionListId: string, classId: string): Promise<void> {
    const questionList = await this.findByIdWithRelations(questionListId, false, true);
    if (!questionList) {
      throw new Error('Lista não encontrada');
    }

    if (questionList.classes) {
      questionList.classes = questionList.classes.filter(c => c.id !== classId);
      await this.repository.save(questionList);
    }
  }

  async findQuestions(questionListId: string): Promise<Question[]> {
    const questionList = await this.findByIdWithRelations(questionListId, true);
    return questionList?.questions || [];
  }

  async findClasses(questionListId: string): Promise<Class[]> {
    const questionList = await this.findByIdWithRelations(questionListId, false, true);
    return questionList?.classes || [];
  }

  async findByQuestionId(questionId: string): Promise<QuestionList | null> {
    return this.repository
      .createQueryBuilder('question_list')
      .innerJoin('question_list.questions', 'question', 'question.id = :questionId', { questionId })
      .getOne();
  }
}

