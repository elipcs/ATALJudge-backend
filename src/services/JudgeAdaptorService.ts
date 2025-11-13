/**
 * @module services/JudgeAdaptorService
 * @description Service adapter for abstracting different judge systems.
 * Provides a unified interface for handling submissions across Judge0 and Codeforces.
 * @class JudgeAdaptorService
 */

import { injectable, inject } from 'tsyringe';
import { Judge0Service, ProcessedSubmissionResult } from './Judge0Service';
import { CodeForcesService, CodeForcesSubmissionRequest, CodeForcesSubmissionResponse } from './CodeForcesService';
import { JudgeType } from '../enums/JudgeType';
import { ProgrammingLanguage } from '../enums/ProgrammingLanguage';
import { logger } from '../utils';

/**
 * Unified submission request interface
 * @interface UnifiedSubmissionRequest
 */
export interface UnifiedSubmissionRequest {
  sourceCode: string;
  language: ProgrammingLanguage;
  stdin?: string;
  expectedOutput?: string;
  judgeType: JudgeType;
  limits?: {
    cpuTimeLimit?: number;
    memoryLimit?: number;
    wallTimeLimit?: number;
  };
  // Codeforces specific
  problemId?: string;
  contestId?: string;
}

/**
 * Unified submission response interface
 * @interface UnifiedSubmissionResponse
 */
export interface UnifiedSubmissionResponse {
  submissionId: string;
  judgeType: JudgeType;
  passed: boolean;
  verdict: string;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  output?: string;
  errorMessage?: string;
}

/**
 * Service adaptor for unified judge system interface
 * Routes submissions to the appropriate judge system (Judge0 or Codeforces)
 * @class JudgeAdaptorService
 */
@injectable()
export class JudgeAdaptorService {
  constructor(
    @inject(Judge0Service) private judge0Service: Judge0Service,
    @inject(CodeForcesService) private codeForcesService: CodeForcesService
  ) {}

  /**
   * Submit code to the appropriate judge system
   * @param request Unified submission request
   * @returns Promise with submission response
   */
  async submitCode(request: UnifiedSubmissionRequest): Promise<UnifiedSubmissionResponse> {
    logger.info('[JudgeAdaptor] Submitting code', {
      judgeType: request.judgeType,
      language: request.language,
      codeLength: request.sourceCode.length
    });

    if (request.judgeType === JudgeType.CODEFORCES) {
      const cfRequest: CodeForcesSubmissionRequest = {
        sourceCode: request.sourceCode,
        language: request.language,
        problemId: request.problemId || '',
        contestId: request.contestId,
        stdin: request.stdin,
        expectedOutput: request.expectedOutput,
        timeLimitSeconds: request.limits?.cpuTimeLimit,
        memoryLimitMB: request.limits?.memoryLimit
      };
      const cfResponse = await this.codeForcesService.submitProblem(cfRequest);
      return this.mapCodeForcesResponse(cfResponse);
    } else {
      const j0Token = await this.judge0Service.createSubmission(
        request.sourceCode,
        request.language,
        request.stdin,
        request.expectedOutput,
        request.limits
      );
      return {
        submissionId: j0Token,
        judgeType: JudgeType.LOCAL,
        passed: false,
        verdict: 'In Queue',
        errorMessage: undefined
      };
    }
  }

  /**
   * Get submission status
   * @param submissionId Submission ID
   * @param judgeType Judge system type
   * @returns Promise with submission status
   */
  async getSubmissionStatus(
    submissionId: string,
    judgeType: JudgeType
  ): Promise<UnifiedSubmissionResponse> {
    logger.debug('[JudgeAdaptor] Getting submission status', {
      submissionId,
      judgeType
    });

    if (judgeType === JudgeType.CODEFORCES) {
      const cfStatus = await this.codeForcesService.getSubmissionStatus(submissionId);
      return this.mapCodeForcesResponse(cfStatus);
    } else {
      const j0Status = await this.judge0Service.getSubmissionStatus(submissionId);
      const processedResult = this.judge0Service.processSubmissionResult(j0Status);
      return this.mapJudge0Response(submissionId, processedResult);
    }
  }

  /**
   * Wait for submission to complete
   * @param submissionId Submission ID
   * @param judgeType Judge system type
   * @param maxAttempts Maximum polling attempts
   * @param intervalMs Polling interval in milliseconds
   * @returns Promise with final submission status
   */
  async waitForSubmission(
    submissionId: string,
    judgeType: JudgeType,
    maxAttempts: number = 60,
    intervalMs: number = 1000
  ): Promise<UnifiedSubmissionResponse> {
    logger.info('[JudgeAdaptor] Waiting for submission', {
      submissionId,
      judgeType,
      maxAttempts,
      intervalMs
    });

    if (judgeType === JudgeType.CODEFORCES) {
      const cfStatus = await this.codeForcesService.waitForSubmission(
        submissionId,
        maxAttempts,
        intervalMs
      );
      return this.mapCodeForcesResponse(cfStatus);
    } else {
      const j0Status = await this.judge0Service.waitForSubmission(
        submissionId,
        maxAttempts,
        intervalMs
      );
      const processedResult = this.judge0Service.processSubmissionResult(j0Status);
      return this.mapJudge0Response(submissionId, processedResult);
    }
  }

  /**
   * Submit batch of submissions
   * @param submissions Array of unified submission requests
   * @param judgeType Judge system type
   * @returns Promise with array of submission IDs
   */
  async submitBatch(
    submissions: UnifiedSubmissionRequest[],
    judgeType: JudgeType
  ): Promise<string[]> {
    logger.info('[JudgeAdaptor] Submitting batch', {
      batchSize: submissions.length,
      judgeType
    });

    if (judgeType === JudgeType.CODEFORCES) {
      const cfRequests: CodeForcesSubmissionRequest[] = submissions.map(sub => ({
        sourceCode: sub.sourceCode,
        language: sub.language,
        problemId: sub.problemId || '',
        contestId: sub.contestId,
        stdin: sub.stdin,
        expectedOutput: sub.expectedOutput,
        timeLimitSeconds: sub.limits?.cpuTimeLimit,
        memoryLimitMB: sub.limits?.memoryLimit
      }));
      return this.codeForcesService.submitBatch(cfRequests);
    } else {
      return this.judge0Service.createBatchSubmissions(
        submissions.map(sub => ({
          sourceCode: sub.sourceCode,
          language: sub.language,
          stdin: sub.stdin,
          expectedOutput: sub.expectedOutput
        })),
        submissions[0]?.limits
      );
    }
  }

  /**
   * Wait for batch submissions with progress callback
   * @param submissionIds Array of submission IDs
   * @param judgeType Judge system type
   * @param onProgress Progress callback
   * @param maxAttempts Maximum polling attempts
   * @param intervalMs Polling interval in milliseconds
   * @returns Promise with array of final statuses
   */
  async waitForBatchWithCallback(
    submissionIds: string[],
    judgeType: JudgeType,
    onProgress: (progress: {
      completed: number;
      pending: number;
      total: number;
      percentage: number;
    }) => Promise<void>,
    maxAttempts: number = 60,
    intervalMs: number = 1000
  ): Promise<UnifiedSubmissionResponse[]> {
    logger.info('[JudgeAdaptor] Waiting for batch with callback', {
      batchSize: submissionIds.length,
      judgeType,
      maxAttempts
    });

    if (judgeType === JudgeType.CODEFORCES) {
      const cfResponses = await this.codeForcesService.waitForBatchWithCallback(
        submissionIds,
        async (progress) => {
          await onProgress({
            completed: progress.completed,
            pending: progress.pending,
            total: progress.total,
            percentage: progress.percentage
          });
        },
        maxAttempts,
        intervalMs
      );
      return cfResponses.map(resp => this.mapCodeForcesResponse(resp));
    } else {
      const j0Responses = await this.judge0Service.waitForBatchSubmissionsWithCallback(
        submissionIds,
        async (progress) => {
          await onProgress({
            completed: progress.completed,
            pending: progress.pending,
            total: progress.total,
            percentage: progress.percentage
          });
        },
        maxAttempts,
        intervalMs
      );
      return j0Responses.map((resp, idx) => {
        const processedResult = this.judge0Service.processSubmissionResult(resp);
        return this.mapJudge0Response(submissionIds[idx], processedResult);
      });
    }
  }

  /**
   * Map Judge0 response to unified format
   * @private
   */
  private mapJudge0Response(
    submissionId: string,
    result: ProcessedSubmissionResult
  ): UnifiedSubmissionResponse {
    return {
      submissionId,
      judgeType: JudgeType.LOCAL,
      passed: result.passed,
      verdict: result.verdict,
      executionTimeMs: result.executionTimeMs,
      memoryUsedKb: result.memoryUsedKb,
      output: result.output,
      errorMessage: result.errorMessage
    };
  }

  /**
   * Map Codeforces response to unified format
   * @private
   */
  private mapCodeForcesResponse(response: CodeForcesSubmissionResponse): UnifiedSubmissionResponse {
    return {
      submissionId: response.submissionId,
      judgeType: JudgeType.CODEFORCES,
      passed: response.passed,
      verdict: response.verdict,
      executionTimeMs: response.executionTimeMs,
      memoryUsedKb: response.memoryUsedKb,
      output: response.output,
      errorMessage: response.errorMessage
    };
  }
}
