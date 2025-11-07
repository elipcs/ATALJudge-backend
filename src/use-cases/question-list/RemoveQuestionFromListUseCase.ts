import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionListRepository } from '../../repositories';
import { NotFoundError, logger } from '../../utils';

export interface RemoveQuestionFromListInput {
  listId: string;
  questionId: string;
}

@injectable()
export class RemoveQuestionFromListUseCase implements IUseCase<RemoveQuestionFromListInput, void> {
  constructor(
    @inject(QuestionListRepository) private listRepository: QuestionListRepository
  ) {}

  async execute(input: RemoveQuestionFromListInput): Promise<void> {
    const { listId, questionId } = input;

    const list = await this.listRepository.findByIdWithRelations(listId, true);

    if (!list) {
      logger.warn('List not found when removing question', { listId, questionId });
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    const countBefore = list.questions.length;
    list.questions = list.questions.filter((q: any) => q.id !== questionId);
    const countAfter = list.questions.length;

    if (countBefore === countAfter) {
      logger.warn('Question was not in the list', { listId, questionId });
    } else {
      await this.listRepository.save(list);
      logger.info('Question removed from list', { listId, questionId });
    }
  }
}
