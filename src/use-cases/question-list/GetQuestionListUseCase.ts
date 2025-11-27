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
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository
  ) {}

  async execute(questionListId: string): Promise<QuestionListResponseDTO> {
    // 1. Find list with relationships
    const questionList = await this.questionListRepository.findByIdWithRelations(questionListId, true, true);

    // 2. Validate existence
    if (!questionList) {
      logger.warn('[GetQuestionListUseCase] List not found', { questionListId });
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    // 3. Convert to DTO
    return this.toDTO(questionList);
  }

  private toDTO(questionList: QuestionList): QuestionListResponseDTO {
    return new QuestionListResponseDTO({
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
      calculatedStatus: questionList.getCalculatedStatus(),
      createdAt: questionList.createdAt,
      updatedAt: questionList.updatedAt,
      questions: questionList.questions,
      questionCount: questionList.getQuestionCount(),
      classIds: questionList.classes?.map(c => c.id) || []
    });
  }
}
