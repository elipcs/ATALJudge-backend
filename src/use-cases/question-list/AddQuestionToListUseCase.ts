import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionListRepository, QuestionRepository } from '../../repositories';
import { NotFoundError, logger } from '../../utils';

export interface AddQuestionToListInput {
  listId: string;
  questionId: string;
}

@injectable()
export class AddQuestionToListUseCase implements IUseCase<AddQuestionToListInput, void> {
  constructor(
    @inject(QuestionListRepository) private listRepository: QuestionListRepository,
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) {}

  async execute(input: AddQuestionToListInput): Promise<void> {
    const { listId, questionId } = input;

    const list = await this.listRepository.findByIdWithRelations(listId, true);

    if (!list) {
      logger.warn('List not found when adding question', { listId, questionId });
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    const question = await this.questionRepository.findById(questionId);

    if (!question) {
      logger.warn('Question not found when adding', { listId, questionId });
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    const alreadyAdded = list.questions.some(q => q.id === questionId);

    if (!alreadyAdded) {
      list.questions.push(question);
      await this.listRepository.save(list);
      logger.info('Question added to list', { listId, questionId });
    } else {
      logger.warn('Question was already in the list', { listId, questionId });
    }
  }
}
