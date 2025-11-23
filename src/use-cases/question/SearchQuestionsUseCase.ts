import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionResponseDTO } from '../../dtos';
import { QuestionRepository } from '../../repositories';
import { QuestionMapper } from '../../mappers';

interface SearchQuestionsInput {
  searchTerm: string;
  page?: number;
  limit?: number;
}

interface SearchQuestionsOutput {
  questions: QuestionResponseDTO[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Use Case: Search questions globally
 * 
 * Responsibilities:
 * - Search questions by title, source, or tags
 * - Support pagination
 * - Convert to DTOs
 */
@injectable()
export class SearchQuestionsUseCase implements IUseCase<SearchQuestionsInput, SearchQuestionsOutput> {
  constructor(
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) {}

  async execute(input: SearchQuestionsInput): Promise<SearchQuestionsOutput> {
    const limit = input.limit || 20;
    const page = Math.max(1, input.page || 1);
    const skip = (page - 1) * limit;

    // 1. Search questions
    const [questions, total] = await this.questionRepository.searchGlobal(
      input.searchTerm,
      skip,
      limit
    );

    // 2. Convert to DTOs
    const questionsDTO = questions.map(question => QuestionMapper.toDTO(question));

    return {
      questions: questionsDTO,
      total,
      page,
      limit
    };
  }
}
