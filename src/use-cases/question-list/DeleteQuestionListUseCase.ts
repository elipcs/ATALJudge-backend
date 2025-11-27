import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionListRepository } from '../../repositories';
import { NotFoundError, ForbiddenError, logger } from '../../utils';

export interface DeleteQuestionListUseCaseInput {
  questionListId: string;
  userId: string;
}

/**
 * Use Case: Delete question list
 * 
 * Responsibilities:
 * - Find list
 * - Check if can be deleted
 * - Delete list
 */
@injectable()
export class DeleteQuestionListUseCase implements IUseCase<DeleteQuestionListUseCaseInput, void> {
  constructor(
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository
  ) {}

  async execute(input: DeleteQuestionListUseCaseInput): Promise<void> {
    const { questionListId, userId } = input;

    // 1. Find list
    const questionList = await this.questionListRepository.findByIdWithRelations(questionListId, false, false);

    if (!questionList) {
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    // 2. Check if can be deleted
    if (!questionList.canBeDeleted()) {
      throw new ForbiddenError(
        'This list cannot be deleted because it has recorded grades',
        'CANNOT_DELETE_LIST'
      );
    }

    // 3. Delete list
    await this.questionListRepository.delete(questionListId);

    logger.info('[DeleteQuestionListUseCase] List deleted', { questionListId, userId });
  }
}
