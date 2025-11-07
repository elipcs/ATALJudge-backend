import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionListRepository } from '../../repositories';
import { NotFoundError, logger } from '../../utils';

export interface RemoveQuestionFromListInput {
  questionListId: string;
  questionId: string;
}

@injectable()
export class RemoveQuestionFromListUseCase implements IUseCase<RemoveQuestionFromListInput, void> {
  constructor(
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository
  ) {}

  async execute(input: RemoveQuestionFromListInput): Promise<void> {
    const { questionListId, questionId } = input;

    const questionList = await this.questionListRepository.findByIdWithRelations(questionListId, true);

    if (!questionList) {
      logger.warn('List not found when removing question', { questionListId, questionId });
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    const countBefore = questionList.questions.length;
    questionList.questions = questionList.questions.filter((q: any) => q.id !== questionId);
    const countAfter = questionList.questions.length;

    if (countBefore === countAfter) {
      logger.warn('Question was not in the list', { questionListId, questionId });
    } else {
      await this.questionListRepository.save(questionList);
      logger.info('Question removed from list', { questionListId, questionId });
    }
  }
}
