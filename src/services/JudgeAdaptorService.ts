/**
 * @module services/JudgeAdaptorService
 * @description Service adapter for abstracting different judge systems.
 * Provides a unified interface for handling submissions across Judge0.
 * @class JudgeAdaptorService
 */

import { injectable, inject } from 'tsyringe';
import { Judge0Service, ProcessedSubmissionResult } from './Judge0Service';
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
  limits?: {
    cpuTimeLimit?: number;
    memoryLimit?: number;
    wallTimeLimit?: number;
  };
}

/**
 * Unified submission response interface
 * @interface UnifiedSubmissionResponse
 */
export interface UnifiedSubmissionResponse {
  submissionId: string;
  passed: boolean;
  verdict: string;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  output?: string;
  errorMessage?: string;
}

/**
 * Service adaptor for unified judge system interface
 * Routes submissions to the appropriate judge system (Judge0)
 * @class JudgeAdaptorService
 */
@injectable()
export class JudgeAdaptorService {
  constructor(
    @inject(Judge0Service) private judge0Service: Judge0Service
  ) { }

  /**
   * Submit code to the appropriate judge system
   * @param request Unified submission request
   * @returns Promise with submission response
   */
  async submitCode(request: UnifiedSubmissionRequest): Promise<UnifiedSubmissionResponse> {
    logger.info('[JudgeAdaptor] Submitting code', {
      language: request.language,
      codeLength: request.sourceCode.length
    });

    {
      const j0Token = await this.judge0Service.createSubmission(
        request.sourceCode,
        request.language,
        request.stdin,
        request.expectedOutput,
        request.limits
      );
      return {
        submissionId: j0Token,
        passed: false,
        verdict: 'In Queue',
        errorMessage: undefined
      };
    }
  }

  /**
   * Get submission status
   * @param submissionId Submission ID
   * @returns Promise with submission status
   */
  async getSubmissionStatus(
    submissionId: string,
  ): Promise<UnifiedSubmissionResponse> {
    logger.debug('[JudgeAdaptor] Getting submission status', {
      submissionId
    });

    {
      const j0Status = await this.judge0Service.getSubmissionStatus(submissionId);
      const processedResult = this.judge0Service.processSubmissionResult(j0Status);
      return this.mapJudge0Response(submissionId, processedResult);
    }
  }

  /**
   * Wait for submission to complete
   * @param submissionId Submission ID
   * @param maxAttempts Maximum polling attempts
   * @param intervalMs Polling interval in milliseconds
   * @returns Promise with final submission status
   */
  async waitForSubmission(
    submissionId: string,
    maxAttempts: number = 60,
    intervalMs: number = 1000
  ): Promise<UnifiedSubmissionResponse> {
    logger.info('[JudgeAdaptor] Waiting for submission', {
      submissionId,
      maxAttempts,
      intervalMs
    });
    {
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
   * @returns Promise with array of submission IDs
   */
  async submitBatch(
    submissions: UnifiedSubmissionRequest[],
  ): Promise<string[]> {
    logger.info('[JudgeAdaptor] Submitting batch', {
      batchSize: submissions.length,
    });
    {
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
   * @param onProgress Progress callback
   * @param maxAttempts Maximum polling attempts
   * @param intervalMs Polling interval in milliseconds
   * @returns Promise with array of final statuses
   */
  async waitForBatchWithCallback(
    submissionIds: string[],
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
      maxAttempts
    });
    {
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
      passed: result.passed,
      verdict: result.verdict,
      executionTimeMs: result.executionTimeMs,
      memoryUsedKb: result.memoryUsedKb,
      output: result.output,
      errorMessage: result.errorMessage
    };
  }


}
