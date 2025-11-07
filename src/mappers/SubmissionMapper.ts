import { Submission } from '../models/Submission';
import { SubmissionResponseDTO, SubmissionDetailDTO, CreateSubmissionDTO, TestCaseResultDTO } from '../dtos/SubmissionDtos';
import { SubmissionStatus } from '../enums';

/**
 * Mapper para transformação entre Submission (Domain) e DTOs
 */
export class SubmissionMapper {
  /**
   * Converte Submission (Domain) para SubmissionResponseDTO
   */
  static toDTO(submission: Submission): SubmissionResponseDTO {
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
      updatedAt: submission.updatedAt
    });
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
   * Cria um DTO simplificado para listagem
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
   * Cria um DTO com informações de progresso
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
