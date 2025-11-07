import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { SubmissionResponseDTO } from '../../dtos';
import { SubmissionRepository } from '../../repositories';
import { SubmissionStatus } from '../../enums';
import { SubmissionMapper } from '../../mappers';

export interface GetAllSubmissionsFilters {
  questionId?: string;
  userId?: string;
  status?: SubmissionStatus;
  verdict?: string;
  page?: number;
  limit?: number;
}

export interface GetAllSubmissionsResponse {
  submissions: SubmissionResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Use Case: Get all submissions with filters
 * 
 * Responsibilities:
 * - Find submissions with optional filters
 * - Apply pagination
 * - Include user and question data
 * - Convert to DTOs
 * - Return with pagination metadata
 */
@injectable()
export class GetAllSubmissionsUseCase implements IUseCase<GetAllSubmissionsFilters, GetAllSubmissionsResponse> {
  constructor(
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository
  ) {}

  async execute(filters: GetAllSubmissionsFilters): Promise<GetAllSubmissionsResponse> {
    // 1. Apply default values
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    // 2. Find submissions with filters
    const { submissions, total } = await this.submissionRepository.findByFilters({
      questionId: filters.questionId,
      userId: filters.userId,
      status: filters.status,
      verdict: filters.verdict,
      page,
      limit
    });

    // 3. Calculate pagination
    const totalPages = Math.ceil(total / limit);

    // 4. Convert to DTOs
    const submissionsDTO = submissions.map(sub => SubmissionMapper.toDTO(sub));

    // 5. Return with pagination
    return {
      submissions: submissionsDTO,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }
}
