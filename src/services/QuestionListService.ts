import { CreateQuestionListDTO, UpdateQuestionListDTO, QuestionListResponseDTO } from '../dtos/QuestionListDtos';
import { NotFoundError, logger } from '../utils';
import { QuestionListRepository, QuestionRepository, ClassRepository, GradeRepository } from '../repositories';
import { GradeService } from './GradeService';

export class QuestionListService {
  private listRepository: QuestionListRepository;
  private questionRepository: QuestionRepository;
  private classRepository: ClassRepository;
  private gradeRepository: GradeRepository;
  private gradeService: GradeService;

  constructor(
    listRepository: QuestionListRepository,
    questionRepository: QuestionRepository,
    classRepository: ClassRepository,
    gradeRepository: GradeRepository,
    gradeService: GradeService
  ) {
    this.listRepository = listRepository;
    this.questionRepository = questionRepository;
    this.classRepository = classRepository;
    this.gradeRepository = gradeRepository;
    this.gradeService = gradeService;
  }

  async getAllLists(filters?: {
    search?: string;
    classId?: string;
    status?: 'draft' | 'published';
  }): Promise<QuestionListResponseDTO[]> {
    const queryBuilder = this.listRepository
      .createQueryBuilder('list')
      .leftJoinAndSelect('list.questions', 'questions')
      .leftJoinAndSelect('list.classes', 'classes')
      .orderBy('list.createdAt', 'DESC');

    if (filters?.search) {
      queryBuilder.andWhere(
        '(list.title ILIKE :search OR list.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters?.classId) {
      queryBuilder.andWhere('classes.id = :classId', { classId: filters.classId });
    }

    const lists = await queryBuilder.getMany();
    return lists.map(list => this.toResponseDTO(list));
  }

  async getListById(id: string): Promise<QuestionListResponseDTO> {
    const list = await this.listRepository.findByIdWithRelations(id, true, true, true);

    if (!list) {
      logger.warn('Lista não encontrada', { listId: id });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    return this.toResponseDTO(list);
  }

  async createList(data: CreateQuestionListDTO, authorId?: string): Promise<QuestionListResponseDTO> {
    const normalizedGroups = (data.questionGroups || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      questionIds: g.questionIds || [],
      weight: g.weight ?? 0,
      percentage: g.percentage
    }));

    const list = await this.listRepository.create({
      title: data.title,
      description: data.description,
      authorId,
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
      list.classes = classes;
      const listWithClasses = await this.listRepository.save(list);
      logger.info('Lista criada com turmas', { listId: listWithClasses.id, classesCount: classes.length });
      return this.toResponseDTO(listWithClasses);
    }

    logger.info('Lista criada', { listId: list.id });
    return this.toResponseDTO(list);
  }

  async updateList(id: string, data: UpdateQuestionListDTO): Promise<QuestionListResponseDTO> {
    const list = await this.listRepository.findByIdWithRelations(id, true, true);

    if (!list) {
      logger.warn('Lista não encontrada para atualização', { listId: id });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    if (data.title) list.title = data.title;
    if (data.description !== undefined) list.description = data.description;
    if (data.startDate) list.startDate = new Date(data.startDate);
    if (data.endDate) list.endDate = new Date(data.endDate);
    if (data.isRestricted !== undefined) list.isRestricted = data.isRestricted;

    if (data.classIds) {
      const classes = await this.classRepository.findByIds(data.classIds);
      list.classes = classes;
    }

    await this.listRepository.save(list);
    logger.info('Lista atualizada', { listId: id });

    return this.toResponseDTO(list);
  }

  async deleteList(id: string): Promise<void> {
    const list = await this.listRepository.findById(id);

    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    await this.listRepository.delete(id);
  }

  async publishList(id: string): Promise<QuestionListResponseDTO> {
    const list = await this.listRepository.findByIdWithRelations(id, true, true);

    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    await this.listRepository.save(list);

    return this.toResponseDTO(list);
  }

  async unpublishList(id: string): Promise<QuestionListResponseDTO> {
    const list = await this.listRepository.findByIdWithRelations(id, true, true);

    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    await this.listRepository.save(list);

    return this.toResponseDTO(list);
  }

  async addQuestionToList(listId: string, questionId: string): Promise<void> {
    const list = await this.listRepository.findByIdWithRelations(listId, true);

    if (!list) {
      logger.warn('Lista não encontrada ao adicionar questão', { listId, questionId });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    const question = await this.questionRepository.findById(questionId);

    if (!question) {
      logger.warn('Questão não encontrada ao adicionar', { listId, questionId });
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }

    const alreadyAdded = list.questions.some(q => q.id === questionId);

    if (!alreadyAdded) {
      list.questions.push(question);
      await this.listRepository.save(list);
      logger.info('Questão adicionada à lista', { listId, questionId });
    } else {
      logger.warn('Questão já estava na lista', { listId, questionId });
    }
  }

  async removeQuestionFromList(listId: string, questionId: string): Promise<void> {
    const list = await this.listRepository.findByIdWithRelations(listId, true);

    if (!list) {
      logger.warn('Lista não encontrada ao remover questão', { listId, questionId });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    const countBefore = list.questions.length;
    list.questions = list.questions.filter((q: any) => q.id !== questionId);
    const countAfter = list.questions.length;

    if (countBefore === countAfter) {
      logger.warn('Questão não estava na lista', { listId, questionId });
    } else {
      await this.listRepository.save(list);
      logger.info('Questão removida da lista', { listId, questionId });
    }
  }

  private toResponseDTO(list: any): QuestionListResponseDTO {
    const classIds = list.classes?.map((c: { id: string }) => c.id) || [];
    
    const questions = (list.questions || [])
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      })
      .map((q: any) => {
        const judgeType = q.submissionType === 'codeforces' ? 'codeforces' : 'local';
        
        return {
          id: q.id,
          title: q.title,
          statement: q.statement,
          inputFormat: q.inputFormat,
          outputFormat: q.outputFormat,
          constraints: q.constraints,
          notes: q.notes,
          tags: q.tags,
          timeLimitMs: q.timeLimitMs,
          memoryLimitKb: q.memoryLimitKb,
          examples: q.examples,
          judgeType,
          authorId: q.authorId,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
          ...(q.submissionType === 'codeforces' && {
            codeforcesContestId: q.contestId,
            codeforcesProblemIndex: q.problemIndex,
            codeforcesLink: q.codeforcesLink
          })
        };
      });
    
    const response = new QuestionListResponseDTO({
      id: list.id,
      title: list.title,
      description: list.description,
      authorId: list.authorId,
      startDate: list.startDate?.toISOString(),
      endDate: list.endDate?.toISOString(),
      scoringMode: list.scoringMode,
      maxScore: list.maxScore,
      minQuestionsForMaxScore: list.minQuestionsForMaxScore,
      questionGroups: list.questionGroups,
      isRestricted: list.isRestricted,
      classIds,
      questions,
      questionCount: questions.length,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      calculatedStatus: list.getCalculatedStatus()
    });

    return response;
  }

  async updateListScoring(id: string, data: any): Promise<QuestionListResponseDTO> {
    const list = await this.listRepository.findByIdWithRelations(id, true, true);

    if (!list) {
      logger.warn('Lista não encontrada para atualizar scoring', { listId: id });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    if (data.scoringMode !== undefined) list.scoringMode = data.scoringMode;
    if (data.maxScore !== undefined) list.maxScore = data.maxScore;
    if (data.minQuestionsForMaxScore !== undefined) list.minQuestionsForMaxScore = data.minQuestionsForMaxScore;
    if (data.questionGroups !== undefined) {
      list.questionGroups = (data.questionGroups || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        questionIds: g.questionIds || [],
        weight: g.weight ?? 0,
        percentage: g.percentage
      }));
    }

    await this.listRepository.save(list);

    try {
      const grades = await this.gradeRepository.findByList(id);

      for (const grade of grades) {
        try {
          await this.gradeService.recalculateAndUpsertGrade(grade.studentId, id);
        } catch (gradeError) {
          logger.error('Erro ao recalcular nota individual', {
            listId: id,
            studentId: grade.studentId,
            error: gradeError instanceof Error ? gradeError.message : 'Erro desconhecido'
          });
        }
      }

      logger.info('Notas recalculadas após atualização de configuração', {
        listId: id,
        totalGrades: grades.length
      });
    } catch (recalcError) {
      logger.error('Erro ao recalcular notas após atualização de configuração', {
        listId: id,
        error: recalcError instanceof Error ? recalcError.message : 'Erro desconhecido'
      });
    }

    const response = this.toResponseDTO(list);
    
    return response;
  }
}

