import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { SubmissionDetailDTO } from '../../dtos';
import { SubmissionRepository } from '../../repositories';
import { NotFoundError } from '../../utils';
import { SubmissionMapper } from '../../mappers';

/**
 * Use Case: Get details of a submission
 * 
 * Responsibilities:
 * - Find submission by ID
 * - Include test results
 * - Convert to detailed DTO
 * - Validate existence
 */
@injectable()
export class GetSubmissionUseCase implements IUseCase<string, SubmissionDetailDTO> {
  constructor(
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository
  ) {}

  async execute(submissionId: string): Promise<SubmissionDetailDTO> {
    // 1. Find submission with results and relationships
    const submission = await this.submissionRepository.findWithResults(submissionId);

    // 2. Validate existence
    if (!submission) {
      throw new NotFoundError('Submission not found', 'SUBMISSION_NOT_FOUND');
    }

    // 3. Convert to detailed DTO
    return SubmissionMapper.toDetailDTO(submission);
  }
}
