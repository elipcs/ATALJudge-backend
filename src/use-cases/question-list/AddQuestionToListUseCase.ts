import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionListRepository, QuestionRepository } from '../../repositories';
import { NotFoundError, logger } from '../../utils';

export interface AddQuestionToListInput {
  questionListId: string;
  questionId: string;
}

@injectable()
export class AddQuestionToListUseCase implements IUseCase<AddQuestionToListInput, void> {
  constructor(
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository,
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) {}

  async execute(input: AddQuestionToListInput): Promise<void> {
    const { questionListId, questionId } = input;

    const questionList = await this.questionListRepository.findByIdWithRelations(questionListId, true);

    if (!questionList) {
      logger.warn('List not found when adding question', { questionListId, questionId });
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    const question = await this.questionRepository.findById(questionId);

    if (!question) {
      logger.warn('Question not found when adding', { questionListId, questionId });
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    const alreadyAdded = questionList.questions.some(q => q.id === questionId);

    if (!alreadyAdded) {
      questionList.questions.push(question);
      await this.questionListRepository.save(questionList);
      logger.info('Question added to list', { questionListId, questionId });
    } else {
      logger.warn('Question was already in the list', { questionListId, questionId });
    }
  }
}
