import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionResponseDTO } from '../../dtos';
import { QuestionRepository } from '../../repositories';
import { QuestionMapper } from '../../mappers';

/**
 * Use Case: Get all questions
 * 
 * Responsibilities:
 * - Find all available questions
 * - Include basic relationships
 * - Convert to DTOs
 * - Can be extended with filters/pagination in the future
 */
@injectable()
export class GetAllQuestionsUseCase implements IUseCase<void, QuestionResponseDTO[]> {
  constructor(
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) {}

  async execute(): Promise<QuestionResponseDTO[]> {
    // 1. Find all questions
    const questions = await this.questionRepository.findAll();

    // 2. Convert to DTOs
    return questions.map(question => QuestionMapper.toDTO(question));
  }
}
