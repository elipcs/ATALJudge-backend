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
 * - Include test results and question list information
 * - Convert to detailed DTO
 * - Validate existence
 */
@injectable()
export class GetSubmissionUseCase implements IUseCase<string, SubmissionDetailDTO> {
  constructor(
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository
  ) {}

  async execute(submissionId: string): Promise<SubmissionDetailDTO> {
    // 1. Find submission with results, question, and question list relationships
    const submission = await this.submissionRepository.findWithResults(submissionId);

    // 2. Validate existence
    if (!submission) {
      throw new NotFoundError('Submission not found', 'SUBMISSION_NOT_FOUND');
    }

    // 3. Ensure question lists are loaded
    if (submission.question && (!submission.question.questionLists || submission.question.questionLists.length === 0)) {
      const fullSubmission = await this.submissionRepository.findByIdWithListInfo(submissionId);
      if (fullSubmission?.question?.questionLists) {
        submission.question.questionLists = fullSubmission.question.questionLists;
      }
    }

    // 4. Convert to detailed DTO
    return SubmissionMapper.toDetailDTO(submission);
  }
}
