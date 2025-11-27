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
  userRole: string;
}

/**
 * Use Case: Update existing question
 * 
 * Responsibilities:
 * - Find question by ID
 * - Check authorization (assistant, or professor can edit)
 * - Apply DTO updates
 * - Save changes
 * - Return updated DTO
 */
@injectable()
export class UpdateQuestionUseCase implements IUseCase<UpdateQuestionUseCaseInput, QuestionResponseDTO> {
  constructor(
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) { }

  async execute(input: UpdateQuestionUseCaseInput): Promise<QuestionResponseDTO> {
    const { questionId, dto, userId, userRole } = input;

    // 1. Find question
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    // 2. Check authorization (professor or assistant can edit)
    const canEdit = userRole === 'professor' ||  userRole === 'assistant';

    if (!canEdit) {
      throw new ForbiddenError('You do not have permission to edit this question', 'FORBIDDEN');
    }

    // 3. Apply updates
    QuestionMapper.applyUpdateDTO(question, dto);



    // 4. Save changes - Create a plain object excluding relations
    const updateData = {
      title: question.title,
      text: question.text,
      timeLimitMs: question.timeLimitMs,
      memoryLimitKb: question.memoryLimitKb,
      examples: question.examples,
      oracleCode: question.oracleCode,
      oracleLanguage: question.oracleLanguage,
      source: question.source,
      tags: question.tags,
    };

    await this.questionRepository.update(question.id, updateData);
    const updatedQuestion = await this.questionRepository.findById(question.id);

    if (!updatedQuestion) {
      throw new NotFoundError('Error updating question', 'UPDATE_FAILED');
    }

    logger.info('[UpdateQuestionUseCase] Question updated', {
      questionId,
      userId
    });

    // 5. Return DTO
    return QuestionMapper.toDTO(updatedQuestion);
  }
}
