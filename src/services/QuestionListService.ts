/**
 * @module services/QuestionListService
 * @description Service for managing question lists and assignments.
 * 
 * Handles list CRUD, question associations, and grading configuration.
 */

import { injectable, inject } from 'tsyringe';
import { CreateQuestionListDTO, UpdateQuestionListDTO, QuestionListResponseDTO } from '../dtos/QuestionListDtos';
import { NotFoundError, logger } from '../utils';
import { QuestionListRepository, QuestionRepository, ClassRepository, GradeRepository } from '../repositories';
import { GradeService } from './GradeService';

/**
 * Service for question list management.
 * @class QuestionListService
 */
@injectable()
export class QuestionListService {
  constructor(
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository,
    @inject(QuestionRepository) private questionRepository: QuestionRepository,
    @inject(ClassRepository) private classRepository: ClassRepository,
    @inject(GradeRepository) private gradeRepository: GradeRepository,
    @inject(GradeService) private gradeService: GradeService
  ) {}

  async getAllLists(filters?: {
    search?: string;
    classId?: string;
    status?: 'draft' | 'published';
  }): Promise<QuestionListResponseDTO[]> {
    const queryBuilder = this.questionListRepository
      .createQueryBuilder('question_list')
      .leftJoinAndSelect('question_list.questions', 'questions')
      .leftJoinAndSelect('question_list.classes', 'classes')
      .orderBy('question_list.createdAt', 'DESC');

    if (filters?.search) {
      queryBuilder.andWhere(
        '(question_list.title ILIKE :search OR question_list.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters?.classId) {
      queryBuilder.andWhere('classes.id = :classId', { classId: filters.classId });
    }

    const questionLists = await queryBuilder.getMany();
    return questionLists.map(questionList => this.toResponseDTO(questionList));
  }

  async getListById(id: string): Promise<QuestionListResponseDTO> {
    const questionList = await this.questionListRepository.findByIdWithRelations(id, true, true);

    if (!questionList) {
      logger.warn('Lista não encontrada', { questionListId: id });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    return this.toResponseDTO(questionList);
  }

  async createList(data: CreateQuestionListDTO): Promise<QuestionListResponseDTO> {
    const normalizedGroups = (data.questionGroups || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      questionIds: g.questionIds || [],
      weight: g.weight ?? 0,
      percentage: g.percentage
    }));

    const questionList = await this.questionListRepository.create({
      title: data.title,
      description: data.description,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      scoringMode: data.scoringMode || 'simple',
      maxScore: data.maxScore || 10,
      minQuestionsForMaxScore: data.minQuestionsForMaxScore,
      questionGroups: normalizedGroups,
      isRestricted: data.isRestricted || false
    });

    if (data.classIds && data.classIds.length > 0) {
      const classes = await this.classRepository.findByIds(data.classIds);
      questionList.classes = classes;
      const questionListWithClasses = await this.questionListRepository.save(questionList);
      logger.info('Lista criada com turmas', { questionListId: questionListWithClasses.id, classesCount: classes.length });
      return this.toResponseDTO(questionListWithClasses);
    }

    logger.info('Lista criada', { questionListId: questionList.id });
    return this.toResponseDTO(questionList);
  }

  async updateList(id: string, data: UpdateQuestionListDTO): Promise<QuestionListResponseDTO> {
    const questionList = await this.questionListRepository.findByIdWithRelations(id, true, true);

    if (!questionList) {
      logger.warn('Lista não encontrada para atualização', { questionListId: id });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    if (data.title) questionList.title = data.title;
    if (data.description !== undefined) questionList.description = data.description;
    if (data.startDate) questionList.startDate = new Date(data.startDate);
    if (data.endDate) questionList.endDate = new Date(data.endDate);
    if (data.isRestricted !== undefined) questionList.isRestricted = data.isRestricted;

    if (data.classIds) {
      const classes = await this.classRepository.findByIds(data.classIds);
      questionList.classes = classes;
    }

    await this.questionListRepository.save(questionList);
    logger.info('Lista atualizada', { questionListId: id });

    return this.toResponseDTO(questionList);
  }

  async deleteList(id: string): Promise<void> {
    const questionList = await this.questionListRepository.findById(id);

    if (!questionList) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    await this.questionListRepository.delete(id);
  }

  async publishList(id: string): Promise<QuestionListResponseDTO> {
    const questionList = await this.questionListRepository.findByIdWithRelations(id, true, true);

    if (!questionList) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    await this.questionListRepository.save(questionList);

    return this.toResponseDTO(questionList);
  }

  async unpublishList(id: string): Promise<QuestionListResponseDTO> {
    const questionList = await this.questionListRepository.findByIdWithRelations(id, true, true);

    if (!questionList) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    await this.questionListRepository.save(questionList);

    return this.toResponseDTO(questionList);
  }

  async addQuestionToList(questionListId: string, questionId: string): Promise<void> {
    const questionList = await this.questionListRepository.findByIdWithRelations(questionListId, true);

    if (!questionList) {
      logger.warn('Lista não encontrada ao adicionar questão', { questionListId, questionId });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    const question = await this.questionRepository.findById(questionId);

    if (!question) {
      logger.warn('Questão não encontrada ao adicionar', { questionListId, questionId });
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }

    const alreadyAdded = questionList.questions.some(q => q.id === questionId);

    if (!alreadyAdded) {
      questionList.questions.push(question);
      await this.questionListRepository.save(questionList);
      logger.info('Questão adicionada à lista', { questionListId, questionId });
    } else {
      logger.warn('Questão já estava na lista', { questionListId, questionId });
    }
  }

  async removeQuestionFromList(questionListId: string, questionId: string): Promise<void> {
    const questionList = await this.questionListRepository.findByIdWithRelations(questionListId, true);

    if (!questionList) {
      logger.warn('Lista não encontrada ao remover questão', { questionListId, questionId });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    const countBefore = questionList.questions.length;
    questionList.questions = questionList.questions.filter((q: any) => q.id !== questionId);
    const countAfter = questionList.questions.length;

    if (countBefore === countAfter) {
      logger.warn('Questão não estava na lista', { questionListId, questionId });
    } else {
      await this.questionListRepository.save(questionList);
      logger.info('Questão removida da lista', { questionListId, questionId });
    }
  }

  private toResponseDTO(questionList: any): QuestionListResponseDTO {
    const classIds = questionList.classes?.map((c: { id: string }) => c.id) || [];
    
    const questions = (questionList.questions || [])
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      })
      .map((q: any) => {
        return {
          id: q.id,
          title: q.title,
          text: q.text,
          timeLimitMs: q.timeLimitMs,
          memoryLimitKb: q.memoryLimitKb,
          examples: q.examples,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        };
      });
    
    const response = new QuestionListResponseDTO({
      id: questionList.id,
      title: questionList.title,
      description: questionList.description,
      startDate: questionList.startDate?.toISOString(),
      endDate: questionList.endDate?.toISOString(),
      scoringMode: questionList.scoringMode,
      maxScore: questionList.maxScore,
      minQuestionsForMaxScore: questionList.minQuestionsForMaxScore,
      questionGroups: questionList.questionGroups,
      isRestricted: questionList.isRestricted,
      countTowardScore: questionList.countTowardScore,
      classIds,
      questions,
      questionCount: questions.length,
      createdAt: questionList.createdAt,
      updatedAt: questionList.updatedAt,
      calculatedStatus: questionList.getCalculatedStatus()
    });

    return response;
  }

  async updateListScoring(id: string, data: any): Promise<QuestionListResponseDTO> {
    const questionList = await this.questionListRepository.findByIdWithRelations(id, true, true);

    if (!questionList) {
      logger.warn('Lista não encontrada para atualizar scoring', { questionListId: id });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    if (data.scoringMode !== undefined) questionList.scoringMode = data.scoringMode;
    if (data.maxScore !== undefined) questionList.maxScore = data.maxScore;
    if (data.minQuestionsForMaxScore !== undefined) questionList.minQuestionsForMaxScore = data.minQuestionsForMaxScore;
    if (data.questionGroups !== undefined) {
      questionList.questionGroups = (data.questionGroups || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        questionIds: g.questionIds || [],
        weight: g.weight ?? 0,
        percentage: g.percentage
      }));
    }

    await this.questionListRepository.save(questionList);

    try {
      const grades = await this.gradeRepository.findByList(id);

      for (const grade of grades) {
        try {
          await this.gradeService.recalculateAndUpsertGrade(grade.studentId, id);
        } catch (gradeError) {
          logger.error('Erro ao recalcular nota individual', {
            questionListId: id,
            studentId: grade.studentId,
            error: gradeError instanceof Error ? gradeError.message : 'Erro desconhecido'
          });
        }
      }

      logger.info('Notas recalculadas após atualização de configuração', {
        questionListId: id,
        totalGrades: grades.length
      });
    } catch (recalcError) {
      logger.error('Erro ao recalcular notas após atualização de configuração', {
        questionListId: id,
        error: recalcError instanceof Error ? recalcError.message : 'Erro desconhecido'
      });
    }

    const response = this.toResponseDTO(questionList);
    
    return response;
  }
}

