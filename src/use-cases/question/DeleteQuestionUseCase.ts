import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionRepository } from '../../repositories';
import { logger, NotFoundError, ValidationError } from '../../utils';

export interface DeleteQuestionUseCaseInput {
  questionId: string;
  userId: string;
}

/**
 * Use Case: Delete question
 * 
 * Responsibilities:
 * - Find question by ID
 * - Check if question can be deleted (without submissions)
 * - Delete question
 */
@injectable()
export class DeleteQuestionUseCase implements IUseCase<DeleteQuestionUseCaseInput, void> {
  constructor(
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) {}

  async execute(input: DeleteQuestionUseCaseInput): Promise<void> {
    const { questionId, userId } = input;

    // 1. Find question
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    // 2. Check if question can be deleted (business rule)
    if (!question.canBeDeleted()) {
      throw new ValidationError(
        'This question cannot be deleted because it has submissions',
        'CANNOT_DELETE_QUESTION'
      );
    }

    // 3. Delete question
    await this.questionRepository.delete(questionId);

    logger.info('[DeleteQuestionUseCase] Question deleted', {
      questionId,
      userId
    });
  }
}
