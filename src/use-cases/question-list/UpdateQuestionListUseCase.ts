import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { UpdateQuestionListDTO, QuestionListResponseDTO } from '../../dtos/QuestionListDtos';
import { QuestionListRepository, ClassRepository } from '../../repositories';
import { NotFoundError, ForbiddenError, logger } from '../../utils';
import { QuestionList } from '../../models/QuestionList';

export interface UpdateQuestionListUseCaseInput {
  questionListId: string;
  dto: UpdateQuestionListDTO;
  userId: string;
}

/**
 * Use Case: Update question list
 * 
 * Responsibilities:
 * - Find existing list
 * - Check edit permission
 * - Apply updates
 * - Update classes (if specified)
 * - Save changes
 */
@injectable()
export class UpdateQuestionListUseCase implements IUseCase<UpdateQuestionListUseCaseInput, QuestionListResponseDTO> {
  constructor(
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository,
    @inject(ClassRepository) private classRepository: ClassRepository
  ) {}

  async execute(input: UpdateQuestionListUseCaseInput): Promise<QuestionListResponseDTO> {
    const { questionListId, dto, userId } = input;

    // 1. Find list with relationships
    const questionList = await this.questionListRepository.findByIdWithRelations(questionListId, true, true);

    if (!questionList) {
      logger.warn('[UpdateQuestionListUseCase] List not found', { questionListId });
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    // 2. Check if list can be edited
    if (!questionList.canBeEdited()) {
      throw new ForbiddenError('This questionList can no longer be edited', 'CANNOT_EDIT_LIST');
    }

    // 3. Apply updates
    if (dto.title) questionList.title = dto.title;
    if (dto.description !== undefined) questionList.description = dto.description;
    if (dto.startDate) questionList.startDate = new Date(dto.startDate);
    if (dto.endDate) questionList.endDate = new Date(dto.endDate);
    if (dto.isRestricted !== undefined) questionList.isRestricted = dto.isRestricted;

    // 4. Update classes (if specified)
    if (dto.classIds !== undefined) {
      if (dto.classIds.length > 0) {
        const classes = await this.classRepository.findByIds(dto.classIds);
        questionList.classes = classes;
      } else {
        questionList.classes = [];
      }
    }

    // 5. Save changes
    const updatedList = await this.questionListRepository.save(questionList);

    logger.info('[UpdateQuestionListUseCase] List updated', { questionListId, userId });

    return this.toDTO(updatedList);
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
