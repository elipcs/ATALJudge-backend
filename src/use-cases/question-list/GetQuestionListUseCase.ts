import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionListResponseDTO } from '../../dtos/QuestionListDtos';
import { QuestionListRepository } from '../../repositories';
import { NotFoundError, logger } from '../../utils';
import { QuestionList } from '../../models/QuestionList';

/**
 * Use Case: Get question list by ID
 * 
 * Responsibilities:
 * - Find list with relationships
 * - Include questions, classes and grades
 * - Convert to DTO
 */
@injectable()
export class GetQuestionListUseCase implements IUseCase<string, QuestionListResponseDTO> {
  constructor(
    @inject(QuestionListRepository) private listRepository: QuestionListRepository
  ) {}

  async execute(listId: string): Promise<QuestionListResponseDTO> {
    // 1. Find list with relationships
    const list = await this.listRepository.findByIdWithRelations(listId, true, true, true);

    // 2. Validate existence
    if (!list) {
      logger.warn('[GetQuestionListUseCase] List not found', { listId });
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    // 3. Convert to DTO
    return this.toDTO(list);
  }

  private toDTO(list: QuestionList): QuestionListResponseDTO {
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
      calculatedStatus: list.getCalculatedStatus(),
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      questions: list.questions,
      questionCount: list.getQuestionCount(),
      classIds: list.classes?.map(c => c.id) || []
    });
  }
}
