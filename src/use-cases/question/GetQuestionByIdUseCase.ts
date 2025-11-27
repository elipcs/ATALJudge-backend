import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionResponseDTO } from '../../dtos';
import { QuestionRepository } from '../../repositories';
import { NotFoundError } from '../../utils';
import { QuestionMapper } from '../../mappers';

/**
 * Use Case: Get question by ID
 * 
 * Responsibilities:
 * - Find question by ID
 * - Include relationships (testCases)
 * - Convert to DTO
 * - Validate existence
 */
@injectable()
export class GetQuestionByIdUseCase implements IUseCase<string, QuestionResponseDTO> {
  constructor(
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) {}

  async execute(questionId: string): Promise<QuestionResponseDTO> {
    // 1. Find question with relationships
    const question = await this.questionRepository.findById(questionId);

    // 2. Validate existence
    if (!question) {
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    // 3. Convert to DTO
    return QuestionMapper.toDTO(question);
  }
}
