import { CreateQuestionListDTO, UpdateQuestionListDTO, QuestionListResponseDTO } from '../dtos/QuestionListDtos';
import { In } from 'typeorm';
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
    logger.debug('[QUESTION_LIST SERVICE] getAllLists chamado', { filters });

    const queryBuilder = this.listRepository
      .getRepository()
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
    const response = lists.map(list => this.toResponseDTO(list));

    logger.info('[QUESTION_LIST SERVICE] getAllLists retornando', {
      totalLists: response.length,
      lists: response.map(l => ({ id: l.id, title: l.title, questionsCount: l.questions?.length || 0 }))
    });

    return response;
  }

  async getListById(id: string): Promise<QuestionListResponseDTO> {
    logger.debug('[QUESTION_LIST SERVICE] getListById chamado', { listId: id });

    const list = await this.listRepository.findByIdWithRelations(id, true, true, true);

    if (!list) {
      logger.warn('[QUESTION_LIST SERVICE] Lista não encontrada', { listId: id });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    const response = this.toResponseDTO(list);
    
    logger.info('[QUESTION_LIST SERVICE] getListById retornando', {
      listId: id,
      title: response.title,
      questionsCount: response.questions?.length || 0,
      classesCount: response.classIds?.length || 0,
      fullResponse: response
    });

    return response;
  }

  async createList(data: CreateQuestionListDTO, authorId?: string): Promise<QuestionListResponseDTO> {
    logger.debug('[QUESTION_LIST SERVICE] createList chamado', {
      title: data.title,
      authorId,
      classIdsCount: data.classIds?.length || 0,
      inputData: data
    });

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

    logger.debug('[QUESTION_LIST SERVICE] Lista criada em memória', {
      listId: list.id,
      title: list.title,
      authorId: list.authorId
    });

    if (data.classIds && data.classIds.length > 0) {
      const classes = await this.classRepository.getRepository().findBy({
        id: In(data.classIds)
      });
      
      logger.debug('[QUESTION_LIST SERVICE] Classes encontradas', {
        requestedClassIds: data.classIds,
        foundClassesCount: classes.length,
        foundClasses: classes.map(c => c.id)
      });

      const listWithClasses = await this.listRepository.getRepository().save({
        ...list,
        classes
      });

      const response = this.toResponseDTO(listWithClasses);
      
      logger.info('[QUESTION_LIST SERVICE] createList retornando com classes', {
        listId: listWithClasses.id,
        title: listWithClasses.title,
        classesCount: classes.length,
        fullResponse: response
      });

      return response;
    }

    const response = this.toResponseDTO(list);
    
    logger.info('[QUESTION_LIST SERVICE] createList retornando sem classes', {
      listId: list.id,
      title: list.title,
      fullResponse: response
    });

    return response;
  }

  async updateList(id: string, data: UpdateQuestionListDTO): Promise<QuestionListResponseDTO> {
    logger.debug('[QUESTION_LIST SERVICE] updateList chamado', {
      listId: id,
      inputData: data,
      classIdsCount: data.classIds?.length || 0
    });

    const list = await this.listRepository.findByIdWithRelations(id, true, true);

    if (!list) {
      logger.warn('[QUESTION_LIST SERVICE] Lista não encontrada para atualização', { listId: id });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    logger.debug('[QUESTION_LIST SERVICE] Lista encontrada, começando atualização', {
      listId: id,
      currentTitle: list.title,
      newTitle: data.title
    });

    if (data.title) list.title = data.title;
    if (data.description !== undefined) list.description = data.description;
    if (data.startDate) list.startDate = new Date(data.startDate);
    if (data.endDate) list.endDate = new Date(data.endDate);
    if (data.isRestricted !== undefined) list.isRestricted = data.isRestricted;

    if (data.classIds) {
      const classes = await this.classRepository.getRepository().findBy({
        id: In(data.classIds)
      });
      
      logger.debug('[QUESTION_LIST SERVICE] Classes atualizadas', {
        requestedClassIds: data.classIds,
        foundClassesCount: classes.length
      });

      list.classes = classes;
    }

    logger.debug('[QUESTION_LIST SERVICE] Salvando lista no banco', {
      listId: id,
      title: list.title
    });

    await this.listRepository.save(list);

    const response = this.toResponseDTO(list);
    
    logger.info('[QUESTION_LIST SERVICE] updateList retornando', {
      listId: id,
      title: response.title,
      classesCount: response.classIds?.length || 0,
      fullResponse: response
    });

    return response;
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
    logger.debug('[QUESTION_LIST SERVICE] addQuestionToList chamado', { listId, questionId });

    const list = await this.listRepository.findByIdWithRelations(listId, true);

    if (!list) {
      logger.warn('[QUESTION_LIST SERVICE] Lista não encontrada ao adicionar questão', { listId, questionId });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    const question = await this.questionRepository.findById(questionId);

    if (!question) {
      logger.warn('[QUESTION_LIST SERVICE] Questão não encontrada ao adicionar', { listId, questionId });
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }

    const alreadyAdded = list.questions.some(q => q.id === questionId);
    
    logger.debug('[QUESTION_LIST SERVICE] Verificando se questão já existe na lista', {
      listId,
      questionId,
      alreadyAdded,
      currentQuestionsCount: list.questions.length
    });

    if (!alreadyAdded) {
      list.questions.push(question);
      
      logger.debug('[QUESTION_LIST SERVICE] Questão adicionada em memória, salvando', {
        listId,
        questionId,
        questionsCountAfter: list.questions.length
      });

      await this.listRepository.save(list);

      logger.info('[QUESTION_LIST SERVICE] Questão adicionada com sucesso', {
        listId,
        questionId,
        questionsCountAfter: list.questions.length
      });
    } else {
      logger.warn('[QUESTION_LIST SERVICE] Questão já estava na lista, não adicionando', { listId, questionId });
    }
  }

  async removeQuestionFromList(listId: string, questionId: string): Promise<void> {
    logger.debug('[QUESTION_LIST SERVICE] removeQuestionFromList chamado', { listId, questionId });

    const list = await this.listRepository.findByIdWithRelations(listId, true);

    if (!list) {
      logger.warn('[QUESTION_LIST SERVICE] Lista não encontrada ao remover questão', { listId, questionId });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    const countBefore = list.questions.length;
    list.questions = list.questions.filter((q: any) => q.id !== questionId);
    const countAfter = list.questions.length;

    if (countBefore === countAfter) {
      logger.warn('[QUESTION_LIST SERVICE] Questão não estava na lista', { listId, questionId });
    } else {
      logger.debug('[QUESTION_LIST SERVICE] Questão removida em memória, salvando', {
        listId,
        questionId,
        questionsCountBefore: countBefore,
        questionsCountAfter: countAfter
      });

      await this.listRepository.save(list);

      logger.info('[QUESTION_LIST SERVICE] Questão removida com sucesso', {
        listId,
        questionId,
        questionsCountAfter: countAfter
      });
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

    logger.debug('[QUESTION_LIST SERVICE] toResponseDTO convertendo lista', {
      listId: list.id,
      title: list.title,
      classIds: classIds.length,
      questionsCount: response.questions?.length || 0,
      response
    });

    return response;
  }

  async updateListScoring(id: string, data: any): Promise<QuestionListResponseDTO> {
    logger.debug('[QUESTION_LIST SERVICE] updateListScoring chamado', {
      listId: id,
      inputData: data
    });

    const list = await this.listRepository.findByIdWithRelations(id, true, true);

    if (!list) {
      logger.warn('[QUESTION_LIST SERVICE] Lista não encontrada para atualizar scoring', { listId: id });
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    logger.debug('[QUESTION_LIST SERVICE] Lista encontrada, atualizando configuração de pontuação', {
      listId: id,
      currentScoringMode: list.scoringMode,
      newScoringMode: data.scoringMode
    });

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

    logger.debug('[QUESTION_LIST SERVICE] Salvando configuração de pontuação', {
      listId: id,
      scoringMode: list.scoringMode,
      maxScore: list.maxScore
    });

    await this.listRepository.save(list);

    // Recalcular notas de todos os estudantes após mudança nas configurações de pontuação
    try {
      logger.info('[QUESTION_LIST SERVICE] Recalculando notas dos estudantes após alteração de configuração', {
        listId: id
      });

      const grades = await this.gradeRepository.findByList(id);
      logger.debug('[QUESTION_LIST SERVICE] Notas encontradas para recalcular', {
        listId: id,
        gradesCount: grades.length
      });

      for (const grade of grades) {
        try {
          await this.gradeService.recalculateAndUpsertGrade(grade.studentId, id);
          logger.debug('[QUESTION_LIST SERVICE] Nota recalculada com sucesso', {
            listId: id,
            studentId: grade.studentId
          });
        } catch (gradeError) {
          logger.error('[QUESTION_LIST SERVICE] Erro ao recalcular nota individual', {
            listId: id,
            studentId: grade.studentId,
            error: gradeError instanceof Error ? gradeError.message : 'Erro desconhecido'
          });
          // Continua para os próximos estudantes mesmo se um falhar
        }
      }

      logger.info('[QUESTION_LIST SERVICE] Recálculo de notas concluído', {
        listId: id,
        totalGrades: grades.length
      });
    } catch (recalcError) {
      logger.error('[QUESTION_LIST SERVICE] Erro ao recalcular notas após atualização de configuração', {
        listId: id,
        error: recalcError instanceof Error ? recalcError.message : 'Erro desconhecido'
      });
      // Não interrompe o retorno da atualização de configuração
    }

    const response = this.toResponseDTO(list);
    
    logger.info('[QUESTION_LIST SERVICE] updateListScoring retornando', {
      listId: id,
      scoringMode: response.scoringMode,
      maxScore: response.maxScore
    });

    return response;
  }
}

