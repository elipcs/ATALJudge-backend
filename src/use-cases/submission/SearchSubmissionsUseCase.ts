import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { SubmissionResponseDTO } from '../../dtos';
import { SubmissionRepository } from '../../repositories';
import { SubmissionStatus } from '../../enums';
import { SubmissionMapper } from '../../mappers';

export interface SearchSubmissionsInput {
  searchTerm: string;
  verdict?: string;
  status?: SubmissionStatus;
  page?: number;
  limit?: number;
}

export interface SearchSubmissionsOutput {
  submissions: SubmissionResponseDTO[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Use Case: Search submissions globally
 * 
 * Responsibilities:
 * - Search submissions by multiple fields (question title, list title, student name, language)
 * - Apply optional filters (verdict, status)
 * - Apply pagination
 * - Convert results to DTOs
 * - Return paginated results with total count
 */
@injectable()
export class SearchSubmissionsUseCase implements IUseCase<SearchSubmissionsInput, SearchSubmissionsOutput> {
  constructor(
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository
  ) {}

  async execute(input: SearchSubmissionsInput): Promise<SearchSubmissionsOutput> {
    // 1. Validate search term
    if (!input.searchTerm || input.searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }

    // 2. Apply default values for pagination
    const page = input.page || 1;
    const limit = input.limit || 20;

    // 3. Search submissions with filters
    const { submissions: rawSubmissions, total } = await this.submissionRepository.searchGlobal(
      input.searchTerm,
      {
        verdict: input.verdict,
        status: input.status,
        page,
        limit,
      }
    );

    // 4. Convert to DTOs
    const submissions = rawSubmissions.map(submission => SubmissionMapper.toDTO(submission));

    // 5. Return with pagination metadata
    return {
      submissions,
      total,
      page,
      limit,
    };
  }
}
