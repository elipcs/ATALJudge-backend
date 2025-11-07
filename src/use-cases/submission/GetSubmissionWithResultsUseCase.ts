import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { SubmissionDetailDTO } from '../../dtos';
import { SubmissionRepository } from '../../repositories';
import { NotFoundError } from '../../utils';
import { SubmissionMapper } from '../../mappers';

export interface GetSubmissionWithResultsInput {
  submissionId: string;
  requestUserId?: string;
}

/**
 * Use Case: Get submission with detailed results
 * 
 * Responsibilities:
 * - Find submission by ID
 * - Validate access permission (students can only see their own)
 * - Include all test results
 * - Include relationships (user, question, results)
 * - Convert to detailed DTO
 * - Validate existence
 */
@injectable()
export class GetSubmissionWithResultsUseCase implements IUseCase<GetSubmissionWithResultsInput, SubmissionDetailDTO> {
  constructor(
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository
  ) {}

  async execute(input: GetSubmissionWithResultsInput): Promise<SubmissionDetailDTO> {
    const { submissionId, requestUserId } = input;
    
    // 1. Find submission with results and relationships
    const submission = await this.submissionRepository.findWithResults(submissionId);

    // 2. Validate existence
    if (!submission) {
      throw new NotFoundError('Submission not found', 'SUBMISSION_NOT_FOUND');
    }

    // 3. Validate access permission (students can only see their own submissions)
    if (requestUserId && submission.userId !== requestUserId) {
      throw new NotFoundError('Submission not found', 'SUBMISSION_NOT_FOUND');
    }

    // 4. Convert to detailed DTO (includes test results)
    return SubmissionMapper.toDetailDTO(submission);
  }
}
