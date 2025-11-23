/**
 * Submission Data Mapper
 * 
 * Maps between Submission domain models and DTOs.
 * Handles conversion of Submission entities to data transfer objects for API responses.
 * 
 * @module mappers/SubmissionMapper
 */
import { Submission } from '../models/Submission';
import { SubmissionResponseDTO, SubmissionDetailDTO, CreateSubmissionDTO, TestCaseResultDTO } from '../dtos/SubmissionDtos';
import { SubmissionStatus } from '../enums';

/**
 * Submission Mapper Class
 * 
 * Provides static methods for converting between Submission domain objects and DTOs.
 * 
 * @class SubmissionMapper
 */
export class SubmissionMapper {
  /**
   * Converts a Submission domain model to SubmissionResponseDTO
   * 
   * @static
   * @param {Submission} submission - The submission domain model
   * @returns {SubmissionResponseDTO} The submission data transfer object
   */
  static toDTO(submission: Submission): SubmissionResponseDTO {
    const questionList = submission.question?.questionLists?.[0];
    
    return new SubmissionResponseDTO({
      id: submission.id,
      userId: submission.userId,
      questionId: submission.questionId,
      code: submission.code,
      language: submission.language,
      status: submission.status,
      score: submission.score,
      totalTests: submission.totalTests,
      passedTests: submission.passedTests,
      executionTimeMs: submission.executionTimeMs,
      memoryUsedKb: submission.memoryUsedKb,
      verdict: submission.verdict,
      errorMessage: submission.errorMessage,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      userName: submission.user?.name,
      userEmail: submission.user?.email,
      questionName: submission.question?.title,
      questionListId: questionList?.id,
      questionListTitle: questionList?.title
    });
  }

  /**
   * Converts a Submission with additional metadata to SubmissionResponseDTO
   * Used when question has questionList relation loaded
   */
  static toDTOWithListInfo(submission: Submission): SubmissionResponseDTO {
    return this.toDTO(submission);
  }

  /**
   * Converte Submission para SubmissionDetailDTO (inclui resultados dos test cases)
   */
  static toDetailDTO(submission: Submission): SubmissionDetailDTO {
    const testResults: TestCaseResultDTO[] = submission.results 
      ? submission.results.map(result => new TestCaseResultDTO({
          testCaseId: result.testCaseId,
          verdict: result.verdict,
          passed: result.passed,
          executionTimeMs: result.executionTimeMs,
          memoryUsedKb: result.memoryUsedKb,
          actualOutput: result.output,
          errorMessage: result.errorMessage
        }))
      : [];

    const questionList = submission.question?.questionLists?.[0];

    return new SubmissionDetailDTO({
      id: submission.id,
      userId: submission.userId,
      questionId: submission.questionId,
      code: submission.code,
      language: submission.language,
      status: submission.status,
      score: submission.score,
      totalTests: submission.totalTests,
      passedTests: submission.passedTests,
      executionTimeMs: submission.executionTimeMs,
      memoryUsedKb: submission.memoryUsedKb,
      verdict: submission.verdict,
      errorMessage: submission.errorMessage,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      questionName: submission.question?.title,
      questionListId: questionList?.id,
      questionListTitle: questionList?.title,
      testResults
    });
  }

  /**
   * Converte lista de Submissions para lista de DTOs
   */
  static toDTOList(submissions: Submission[]): SubmissionResponseDTO[] {
    return submissions.map(sub => this.toDTO(sub));
  }

  /**
   * Aplica dados de CreateSubmissionDTO ao Submission (Domain)
   */
  static applyCreateDTO(submission: Submission, dto: CreateSubmissionDTO, userId: string): void {
    submission.userId = userId;
    submission.questionId = dto.questionId;
    submission.code = dto.code;
    submission.language = dto.language;
    submission.status = SubmissionStatus.PENDING;
    submission.score = 0;
    submission.totalTests = 0;
    submission.passedTests = 0;
  }

  /**
   * Creates a simplified DTO for listing
   */
  static toListItemDTO(submission: Submission): Pick<SubmissionResponseDTO, 'id' | 'questionId' | 'status' | 'score' | 'createdAt'> {
    return {
      id: submission.id,
      questionId: submission.questionId,
      status: submission.status,
      score: submission.score,
      createdAt: submission.createdAt
    };
  }

  /**
   * Creates a DTO with progress information
   */
  static toProgressDTO(submission: Submission) {
    return {
      id: submission.id,
      status: submission.status,
      score: submission.score,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      isProcessing: submission.isProcessing(),
      isFinished: submission.isFinished(),
      hasPassedAllTests: submission.hasPassedAllTests(),
      passPercentage: submission.getPassPercentage()
    };
  }
}
