import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { UpdateQuestionDTO, QuestionResponseDTO } from '../../dtos';
import { QuestionRepository } from '../../repositories';
import { QuestionMapper } from '../../mappers';
import { logger, NotFoundError, ForbiddenError } from '../../utils';

export interface UpdateQuestionUseCaseInput {
  questionId: string;
  dto: UpdateQuestionDTO;
  userId: string;
}

/**
 * Use Case: Update existing question
 * 
 * Responsibilities:
 * - Find question by ID
 * - Check if user is author (authorization)
 * - Apply DTO updates
 * - Save changes
 * - Return updated DTO
 */
@injectable()
export class UpdateQuestionUseCase implements IUseCase<UpdateQuestionUseCaseInput, QuestionResponseDTO> {
  constructor(
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) {}

  async execute(input: UpdateQuestionUseCaseInput): Promise<QuestionResponseDTO> {
    const { questionId, dto, userId } = input;

    // 1. Find question
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    // 2. Check authorization (only author can edit)
    if (question.authorId !== userId) {
      throw new ForbiddenError('You do not have permission to edit this question', 'FORBIDDEN');
    }

    // 3. Check if question can be edited (business rule)
    if (!question.canBeEdited()) {
      throw new ForbiddenError('This question can no longer be edited', 'CANNOT_EDIT_QUESTION');
    }

    // 4. Apply updates
    QuestionMapper.applyUpdateDTO(question, dto);

    // 5. Save changes (update returns partial, so we fetch again)
    await this.questionRepository.update(question.id, question);
    const updatedQuestion = await this.questionRepository.findById(question.id);

    if (!updatedQuestion) {
      throw new NotFoundError('Error updating question', 'UPDATE_FAILED');
    }

    logger.info('[UpdateQuestionUseCase] Question updated', { 
      questionId, 
      userId 
    });

    // 6. Return DTO
    return QuestionMapper.toDTO(updatedQuestion);
  }
}
