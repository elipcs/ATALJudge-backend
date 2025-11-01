import { LocalQuestion } from '../models/LocalQuestion';
import { CodeforcesQuestion } from '../models/CodeforcesQuestion';
import { CreateQuestionListDTO, UpdateQuestionListDTO, QuestionListResponseDTO } from '../dtos/QuestionListDtos';
import { In } from 'typeorm';
import { NotFoundError } from '../utils';
import { QuestionListRepository, QuestionRepository, ClassRepository } from '../repositories';

/**
 * Service para gerenciamento de listas de questões
 */
export class QuestionListService {
  private listRepository: QuestionListRepository;
  private questionRepository: QuestionRepository;
  private classRepository: ClassRepository;

  constructor(
    listRepository: QuestionListRepository,
    questionRepository: QuestionRepository,
    classRepository: ClassRepository
  ) {
    this.listRepository = listRepository;
    this.questionRepository = questionRepository;
    this.classRepository = classRepository;
  }

  /**
   * Lista todas as listas com filtros
   */
  async getAllLists(filters?: {
    search?: string;
    classId?: string;
    status?: 'draft' | 'published';
  }): Promise<QuestionListResponseDTO[]> {
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

    return lists.map(list => this.toResponseDTO(list));
  }

  /**
   * Busca lista por ID
   */
  async getListById(id: string): Promise<QuestionListResponseDTO> {
    const list = await this.listRepository.findByIdWithRelations(id, true, true, true);

    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    return this.toResponseDTO(list);
  }

  /**
   * Cria uma nova lista
   */
  async createList(data: CreateQuestionListDTO, authorId?: string): Promise<QuestionListResponseDTO> {
    const list = await this.listRepository.create({
      title: data.title,
      description: data.description,
      authorId,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      scoringMode: data.scoringMode || 'simple',
      maxScore: data.maxScore || 10,
      minQuestionsForMaxScore: data.minQuestionsForMaxScore,
      questionGroups: data.questionGroups || [],
      isRestricted: data.isRestricted || false
    });

    // Associar turmas
    if (data.classIds && data.classIds.length > 0) {
      const classes = await this.classRepository.getRepository().findBy({
        id: In(data.classIds)
      });
      const listWithClasses = await this.listRepository.getRepository().save({
        ...list,
        classes
      });
      return this.toResponseDTO(listWithClasses);
    }

    return this.toResponseDTO(list);
  }

  /**
   * Atualiza uma lista
   */
  async updateList(id: string, data: UpdateQuestionListDTO): Promise<QuestionListResponseDTO> {
    const list = await this.listRepository.findByIdWithRelations(id, true, true);

    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    // Atualizar campos
    if (data.title) list.title = data.title;
    if (data.description !== undefined) list.description = data.description;
    if (data.startDate) list.startDate = new Date(data.startDate);
    if (data.endDate) list.endDate = new Date(data.endDate);
    if (data.scoringMode) list.scoringMode = data.scoringMode;
    if (data.maxScore !== undefined) list.maxScore = data.maxScore;
    if (data.minQuestionsForMaxScore !== undefined) list.minQuestionsForMaxScore = data.minQuestionsForMaxScore;
    if (data.questionGroups) list.questionGroups = data.questionGroups;
    if (data.isRestricted !== undefined) list.isRestricted = data.isRestricted;

    // Atualizar turmas
    if (data.classIds) {
      const classes = await this.classRepository.getRepository().findBy({
        id: In(data.classIds)
      });
      list.classes = classes;
    }

    await this.listRepository.save(list);

    return this.toResponseDTO(list);
  }

  /**
   * Deleta uma lista
   */
  async deleteList(id: string): Promise<void> {
    const list = await this.listRepository.findById(id);

    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    await this.listRepository.delete(id);
  }

  /**
   * Publica uma lista
   */
  async publishList(id: string): Promise<QuestionListResponseDTO> {
    const list = await this.listRepository.findByIdWithRelations(id, true, true);

    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    await this.listRepository.save(list);

    return this.toResponseDTO(list);
  }

  /**
   * Despublica uma lista
   */
  async unpublishList(id: string): Promise<QuestionListResponseDTO> {
    const list = await this.listRepository.findByIdWithRelations(id, true, true);

    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    await this.listRepository.save(list);

    return this.toResponseDTO(list);
  }

  /**
   * Adiciona questão à lista
   */
  async addQuestionToList(listId: string, questionId: string): Promise<void> {
    const list = await this.listRepository.findByIdWithRelations(listId, true);

    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    const question = await this.questionRepository.findById(questionId);

    if (!question) {
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }

    // Verificar se já está na lista
    const alreadyAdded = list.questions.some(q => q.id === questionId);
    if (!alreadyAdded) {
      list.questions.push(question);
      await this.listRepository.save(list);
    }
  }

  /**
   * Remove questão da lista
   */
  async removeQuestionFromList(listId: string, questionId: string): Promise<void> {
    const list = await this.listRepository.findByIdWithRelations(listId, true);

    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    list.questions = list.questions.filter((q: any) => q.id !== questionId);
    await this.listRepository.save(list);
  }

  /**
   * Converte entidade para DTO de resposta
   */
  private toResponseDTO(list: any): QuestionListResponseDTO {
    const classIds = list.classes?.map((c: { id: string }) => c.id) || [];
    
    return new QuestionListResponseDTO({
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
      questions: list.questions?.map((q: any) => {
        const judgeType = q instanceof LocalQuestion 
          ? 'local' 
          : q instanceof CodeforcesQuestion 
          ? 'codeforces' 
          : 'local';
        
        return {
        id: q.id,
        title: q.title,
        statement: q.statement,
        tags: q.tags,
          judgeType
        };
      }) || [],
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      calculatedStatus: list.getCalculatedStatus()
    });
  }
}


