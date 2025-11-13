import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { SubmissionRepository, QuestionRepository } from '../../repositories';
import { SubmissionMapper } from '../../mappers';
import { SubmissionResponseDTO } from '../../dtos';
import { logger, NotFoundError, ForbiddenError } from '../../utils';
import { Submission } from '../../models/Submission';
import { SubmissionStatus, ProgrammingLanguage, UserRole } from '../../enums';
import { SubmissionQueueService } from '../../services/SubmissionQueueService';

export interface ResubmitSubmissionUseCaseInput {
  submissionId: string;
  requestUserId: string;
  requestUserRole: string;
}

/**
 * Use Case: Resubmit an existing submission
 * 
 * Allows professors and assistants to resubmit a student's submission
 * Creates a new submission with the same code, language, and original user
 * 
 * Responsibilities:
 * - Find original submission
 * - Check authorization (only professor or assistant)
 * - Verify question exists
 * - Create new submission with original user's data
 * - Process the new submission
 * - Return new submission DTO
 */
@injectable()
export class ResubmitSubmissionUseCase implements IUseCase<ResubmitSubmissionUseCaseInput, SubmissionResponseDTO> {
  constructor(
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository,
    @inject(QuestionRepository) private questionRepository: QuestionRepository,
    @inject('SubmissionQueueService') private queueService?: SubmissionQueueService
  ) {}

  async execute(input: ResubmitSubmissionUseCaseInput): Promise<SubmissionResponseDTO> {
    const { submissionId, requestUserId, requestUserRole } = input;

    // 1. Check authorization - only professors and assistants can resubmit
    if (requestUserRole !== UserRole.PROFESSOR && requestUserRole !== UserRole.ASSISTANT) {
      logger.warn('[ResubmitSubmissionUseCase] Unauthorized resubmit attempt', { 
        submissionId, 
        requestUserId,
        requestUserRole 
      });
      throw new ForbiddenError('Only professors and assistants can resubmit submissions', 'FORBIDDEN');
    }

    // 2. Find original submission
    const originalSubmission = await this.submissionRepository.findById(submissionId);
    if (!originalSubmission) {
      throw new NotFoundError('Original submission not found', 'SUBMISSION_NOT_FOUND');
    }

    // 3. Verify question still exists
    const question = await this.questionRepository.findById(originalSubmission.questionId);
    if (!question) {
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    // 4. Create new submission with original user's data
    const newSubmission = new Submission();
    newSubmission.userId = originalSubmission.userId; // Keep original user
    newSubmission.questionId = originalSubmission.questionId;
    newSubmission.code = originalSubmission.code;
    newSubmission.language = originalSubmission.language as ProgrammingLanguage;
    newSubmission.status = SubmissionStatus.PENDING;
    newSubmission.score = 0;
    newSubmission.totalTests = 0;
    newSubmission.passedTests = 0;

    const savedSubmission = await this.submissionRepository.create(newSubmission);
    
    logger.info('[ResubmitSubmissionUseCase] Submission resubmitted', { 
      originalSubmissionId: submissionId,
      newSubmissionId: savedSubmission.id,
      originalUserId: originalSubmission.userId,
      resubmittedBy: requestUserId,
      questionId: originalSubmission.questionId 
    });

    // 5. Add to queue or process directly
    const finalStatus = await this.enqueueOrProcessSubmission(savedSubmission.id);
    savedSubmission.status = finalStatus;

    // 6. Return DTO
    return SubmissionMapper.toDTO(savedSubmission);
  }

  /**
   * Adds submission to queue or schedules direct processing
   */
  private async enqueueOrProcessSubmission(submissionId: string): Promise<SubmissionStatus> {
    if (this.queueService) {
      await this.queueService.addSubmissionToQueue(submissionId);
      logger.info('[ResubmitSubmissionUseCase] Submission added to queue', { submissionId });
      return SubmissionStatus.IN_QUEUE;
    } else {
      logger.info('[ResubmitSubmissionUseCase] Direct processing scheduled', { submissionId });
      return SubmissionStatus.PENDING;
    }
  }
}

