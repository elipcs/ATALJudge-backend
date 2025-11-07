import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { UpdateQuestionListDTO, QuestionListResponseDTO } from '../../dtos/QuestionListDtos';
import { QuestionListRepository, ClassRepository } from '../../repositories';
import { NotFoundError, ForbiddenError, logger } from '../../utils';
import { QuestionList } from '../../models/QuestionList';

export interface UpdateQuestionListUseCaseInput {
  listId: string;
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
    @inject(QuestionListRepository) private listRepository: QuestionListRepository,
    @inject(ClassRepository) private classRepository: ClassRepository
  ) {}

  async execute(input: UpdateQuestionListUseCaseInput): Promise<QuestionListResponseDTO> {
    const { listId, dto, userId } = input;

    // 1. Find list with relationships
    const list = await this.listRepository.findByIdWithRelations(listId, true, true);

    if (!list) {
      logger.warn('[UpdateQuestionListUseCase] List not found', { listId });
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    // 2. Check permission (only author can edit)
    if (list.authorId !== userId) {
      throw new ForbiddenError('You do not have permission to edit this list', 'FORBIDDEN');
    }

    // 3. Check if list can be edited
    if (!list.canBeEdited()) {
      throw new ForbiddenError('This list can no longer be edited', 'CANNOT_EDIT_LIST');
    }

    // 4. Apply updates
    if (dto.title) list.title = dto.title;
    if (dto.description !== undefined) list.description = dto.description;
    if (dto.startDate) list.startDate = new Date(dto.startDate);
    if (dto.endDate) list.endDate = new Date(dto.endDate);
    if (dto.isRestricted !== undefined) list.isRestricted = dto.isRestricted;

    // 5. Update classes (if specified)
    if (dto.classIds !== undefined) {
      if (dto.classIds.length > 0) {
        const classes = await this.classRepository.findByIds(dto.classIds);
        list.classes = classes;
      } else {
        list.classes = [];
      }
    }

    // 6. Save changes
    const updatedList = await this.listRepository.save(list);

    logger.info('[UpdateQuestionListUseCase] List updated', { listId, userId });

    return this.toDTO(updatedList);
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
