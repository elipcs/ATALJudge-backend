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
 * - Check authorization (author, assistant, or professor can edit)
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
    const { questionId, dto, userId, userRole } = input;

    // 1. Find question
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    // 2. Check authorization (author, assistant, or professor can edit)
    const canEdit = question.authorId === userId || 
                     userRole === 'professor' || 
                     userRole === 'assistant';
    
    if (!canEdit) {
      throw new ForbiddenError('You do not have permission to edit this question', 'FORBIDDEN');
    }

    // 3. Check if question can be edited (business rule)
    // Allow editing if:
    // - Question is local (can always be edited)
    // - OR we're changing from codeforces to local (allow this specific change)
    const isChangingToLocal = dto.submissionType === 'local' && question.submissionType === 'codeforces';
    const canBeEdited = question.canBeEdited() || isChangingToLocal;
    
    if (!canBeEdited) {
      throw new ForbiddenError('This question can no longer be edited', 'CANNOT_EDIT_QUESTION');
    }

    // 4. Apply updates
    QuestionMapper.applyUpdateDTO(question, dto);

    // 4.1. If changing from codeforces to local, clear codeforces fields
    if (isChangingToLocal) {
      question.contestId = undefined;
      question.problemIndex = undefined;
      logger.info('[UpdateQuestionUseCase] Clearing Codeforces fields when changing to local', { questionId });
    }

    // 5. Save changes - Create a plain object excluding relations
    // Note: Codeforces fields (contestId, problemIndex) are cleared if changing to local
    const updateData = {
      title: question.title,
      text: question.text,
      timeLimitMs: question.timeLimitMs,
      memoryLimitKb: question.memoryLimitKb,
      wallTimeLimitSeconds: question.wallTimeLimitSeconds,
      examples: question.examples,
      submissionType: question.submissionType,
      contestId: question.contestId,
      problemIndex: question.problemIndex,
      oracleCode: question.oracleCode,
      oracleLanguage: question.oracleLanguage,
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

    // 6. Return DTO
    return QuestionMapper.toDTO(updatedQuestion);
  }
}
