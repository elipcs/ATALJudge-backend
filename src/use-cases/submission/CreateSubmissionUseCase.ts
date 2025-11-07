import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { CreateSubmissionDTO, SubmissionResponseDTO } from '../../dtos';
import { SubmissionRepository, QuestionRepository } from '../../repositories';
import { SubmissionQueueService } from '../../services/SubmissionQueueService';
import { SubmissionStatus, ProgrammingLanguage } from '../../enums';
import { logger, ValidationError, NotFoundError } from '../../utils';
import { SubmissionMapper } from '../../mappers';
import { Submission } from '../../models/Submission';

export interface CreateSubmissionUseCaseInput {
  dto: CreateSubmissionDTO;
  userId: string;
}

/**
 * Use Case: Create new code submission
 * 
 * Responsibilities:
 * - Validate programming language
 * - Check if question exists
 * - Create submission in database
 * - Add to processing queue (or process directly)
 * - Return created submission with updated status
 */
@injectable()
export class CreateSubmissionUseCase implements IUseCase<CreateSubmissionUseCaseInput, SubmissionResponseDTO> {
  constructor(
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository,
    @inject(QuestionRepository) private questionRepository: QuestionRepository,
    @inject('SubmissionQueueService') private queueService?: SubmissionQueueService
  ) {}

  async execute(input: CreateSubmissionUseCaseInput): Promise<SubmissionResponseDTO> {
    const { dto, userId } = input;

    // 1. Validate programming language
    if (!Object.values(ProgrammingLanguage).includes(dto.language as ProgrammingLanguage)) {
      logger.warn('[CreateSubmissionUseCase] Invalid language', { language: dto.language });
      throw new ValidationError('Invalid programming language', 'INVALID_LANGUAGE');
    }

    // 2. Check if question exists
    const question = await this.questionRepository.findById(dto.questionId);
    if (!question) {
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    // 3. Create submission in database
    const submission = new Submission();
    submission.userId = userId;
    submission.questionId = dto.questionId;
    submission.code = dto.code;
    submission.language = dto.language as ProgrammingLanguage;
    submission.status = SubmissionStatus.PENDING;
    submission.score = 0;
    submission.totalTests = 0;
    submission.passedTests = 0;

    const savedSubmission = await this.submissionRepository.create(submission);
    
    logger.info('[CreateSubmissionUseCase] Submission created', { 
      submissionId: savedSubmission.id, 
      userId, 
      questionId: dto.questionId 
    });

    // 4. Add to queue or process directly
    const finalStatus = await this.enqueueOrProcessSubmission(savedSubmission.id);
    savedSubmission.status = finalStatus;

    // 5. Return DTO
    return SubmissionMapper.toDTO(savedSubmission);
  }

  /**
   * Adds submission to queue or schedules direct processing
   */
  private async enqueueOrProcessSubmission(submissionId: string): Promise<SubmissionStatus> {
    if (this.queueService) {
      logger.info('[CreateSubmissionUseCase] Adding to queue', { submissionId });
      
      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.IN_QUEUE
      });

      await this.queueService.addSubmissionToQueue(submissionId);
      
      logger.info('[CreateSubmissionUseCase] Submission added to queue', { submissionId });
      return SubmissionStatus.IN_QUEUE;
    } else {
      logger.warn('[CreateSubmissionUseCase] Queue not available, processing will be in background', { 
        submissionId 
      });
      return SubmissionStatus.PENDING;
    }
  }
}
