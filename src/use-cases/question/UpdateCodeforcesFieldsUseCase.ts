import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { UpdateCodeforcesFieldsDTO, QuestionResponseDTO } from '../../dtos';
import { QuestionRepository } from '../../repositories';
import { QuestionMapper } from '../../mappers';
import { logger, NotFoundError, ForbiddenError } from '../../utils';

export interface UpdateCodeforcesFieldsUseCaseInput {
  questionId: string;
  dto: UpdateCodeforcesFieldsDTO;
  userId: string;
  userRole: string;
}

/**
 * Use Case: Update Codeforces-specific fields (part 2 of question editing)
 * 
 * Responsibilities:
 * - Find question by ID
 * - Check authorization (author, assistant, or professor can edit)
 * - Apply DTO updates to Codeforces fields only
 * - Automatically set submissionType to 'codeforces'
 * - Save changes
 * - Return updated DTO
 */
@injectable()
export class UpdateCodeforcesFieldsUseCase implements IUseCase<UpdateCodeforcesFieldsUseCaseInput, QuestionResponseDTO> {
  constructor(
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) {}

  async execute(input: UpdateCodeforcesFieldsUseCaseInput): Promise<QuestionResponseDTO> {
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
    if (!question.canBeEdited()) {
      throw new ForbiddenError('This question can no longer be edited', 'CANNOT_EDIT_QUESTION');
    }

    // 4. Apply updates to Codeforces fields only
    QuestionMapper.applyCodeforcesUpdate(question, dto);

    // 4.1. Automatically set submissionType to 'codeforces' when configuring Codeforces fields
    question.submissionType = 'codeforces';

    // 5. Save changes - Create a plain object with Codeforces fields + submissionType
    const updateData = {
      submissionType: question.submissionType,
      contestId: question.contestId,
      problemIndex: question.problemIndex,
    };
    
    await this.questionRepository.update(question.id, updateData);
    const updatedQuestion = await this.questionRepository.findById(question.id);

    if (!updatedQuestion) {
      throw new NotFoundError('Error updating question', 'UPDATE_FAILED');
    }

    logger.info('[UpdateCodeforcesFieldsUseCase] Codeforces fields updated', { 
      questionId, 
      userId 
    });

    // 6. Return DTO
    return QuestionMapper.toDTO(updatedQuestion);
  }
}
