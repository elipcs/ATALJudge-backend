/**
 * @module services/CodeForcesService
 * @description Service for integration with Codeforces API.
 * Provides operations to submit code for execution and retrieve results.
 * Codeforces is used as a judge system for competitive programming problems.
 * @class CodeForcesService
 */

import { injectable } from 'tsyringe';
import axios from 'axios';
import { config } from '../config';
import { ProgrammingLanguage } from '../enums/ProgrammingLanguage';
import { JudgeVerdict } from '../enums/JudgeVerdict';
import { logger } from '../utils';

/**
 * Codeforces submission request interface
 * @interface CodeForcesSubmissionRequest
 */
export interface CodeForcesSubmissionRequest {
  /** Problem ID (e.g., "1A", "2B") */
  problemId: string;
  
  /** User's source code */
  sourceCode: string;
  
  /** Programming language ID */
  language: ProgrammingLanguage;
  
  /** Codeforces contest ID */
  contestId?: string;
  
  /** Test case input */
  stdin?: string;
  
  /** Expected output */
  expectedOutput?: string;
  
  /** Time limit in seconds */
  timeLimitSeconds?: number;
  
  /** Memory limit in MB */
  memoryLimitMB?: number;
}

/**
 * Codeforces submission response interface
 * @interface CodeForcesSubmissionResponse
 */
export interface CodeForcesSubmissionResponse {
  /** Submission ID returned by Codeforces */
  submissionId: string;
  
  /** Submission verdict */
  verdict: JudgeVerdict;
  
  /** Execution time in milliseconds */
  executionTimeMs?: number;
  
  /** Memory used in KB */
  memoryUsedKb?: number;
  
  /** Output from execution */
  output?: string;
  
  /** Error message if any */
  errorMessage?: string;
  
  /** Whether the submission passed */
  passed: boolean;
}

/**
 * Codeforces API Problem interface
 * @interface CodeForcesProblem
 */
export interface CodeForcesProblem {
  contestId: number;
  problemId: string;
  title: string;
  timeLimit?: number;
  memoryLimit?: number;
  input?: string;
  output?: string;
}

/**
 * Codeforces batch submission status
 * @interface CodeForcesBatchStatus
 */
export interface CodeForcesBatchStatus {
  submissionId: string;
  verdict: JudgeVerdict;
  executionTimeMs?: number;
  memoryUsedKb?: number;
}

/**
 * Service for Codeforces integration
 * Handles submission of code to Codeforces problems and retrieval of results
 * @class CodeForcesService
 */
@injectable()
export class CodeForcesService {
  private pythonApiUrl: string;
  private pythonApiTimeout: number;
  private axiosInstance;

  constructor() {
    this.pythonApiUrl = config.codeforces.pythonApiUrl;
    this.pythonApiTimeout = config.codeforces.pythonApiTimeout;

    this.axiosInstance = axios.create({
      baseURL: this.pythonApiUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ATALJudge-Backend/1.0'
      },
      timeout: this.pythonApiTimeout, // 60 segundos por padrão
      // Configurações adicionais para evitar ECONNRESET
      httpAgent: new (require('http').Agent)({ 
        keepAlive: true,
        timeout: this.pythonApiTimeout 
      }),
      httpsAgent: new (require('https').Agent)({ 
        keepAlive: true,
        timeout: this.pythonApiTimeout 
      })
    });

    logger.info(`[Codeforces] Service initialized with Python API URL: ${this.pythonApiUrl}`);
  }
  
  /**
   * Map programming language enum to Codeforces language string
   */
  private mapLanguageToCodeforces(language: ProgrammingLanguage): string {
    const languageMap: Record<string, string> = {
      [ProgrammingLanguage.PYTHON]: 'python3',
      [ProgrammingLanguage.CPP]: 'cpp',
      [ProgrammingLanguage.C]: 'c',
      [ProgrammingLanguage.JAVA]: 'java',
      [ProgrammingLanguage.JAVASCRIPT]: 'javascript',
    };
    
    return languageMap[language] || 'python3';
  }
  
  /**
   * Map Codeforces verdict to JudgeVerdict enum
   */
  private mapCodeforcesVerdict(verdict: string): JudgeVerdict {
    const verdictMap: Record<string, JudgeVerdict> = {
      'Accepted': JudgeVerdict.ACCEPTED,
      'Wrong Answer': JudgeVerdict.WRONG_ANSWER,
      'Time Limit Exceeded': JudgeVerdict.TIME_LIMIT_EXCEEDED,
      'Memory Limit Exceeded': JudgeVerdict.MEMORY_LIMIT_EXCEEDED,
      'Runtime Error': JudgeVerdict.RUNTIME_ERROR,
      'Compilation Error': JudgeVerdict.COMPILATION_ERROR,
      'Internal Error': JudgeVerdict.INTERNAL_ERROR,
      'Processing': JudgeVerdict.ACCEPTED, // Temporary state
      'In Queue': JudgeVerdict.ACCEPTED, // Temporary state
    };
    
    return verdictMap[verdict] || JudgeVerdict.INTERNAL_ERROR;
  }

  /**
   * Submit code to a Codeforces problem
   * @param request Submission request data
   * @returns Promise with submission ID and initial verdict
   */
  async submitProblem(request: CodeForcesSubmissionRequest): Promise<CodeForcesSubmissionResponse> {
    try {
      logger.info('[Codeforces] Submitting problem', {
        problemId: request.problemId,
        language: request.language,
        codeLength: request.sourceCode.length
      });

      const languageStr = this.mapLanguageToCodeforces(request.language);
      
      const response = await this.axiosInstance.post('/api/submit', {
        problem_id: request.problemId,
        source_code: request.sourceCode,
        language: languageStr
      });

      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.message || 'Submission failed');
      }

      logger.info('[Codeforces] Submission created', {
        submissionId: data.submission_id,
        problemId: request.problemId
      });

      return {
        submissionId: data.submission_id,
        verdict: JudgeVerdict.ACCEPTED, // Initial state, will be updated when checking status
        executionTimeMs: 0,
        memoryUsedKb: 0,
        output: '',
        passed: false
      };
      
    } catch (error) {
      logger.error('[Codeforces] Error submitting problem', {
        problemId: request.problemId,
        language: request.language,
        error: error instanceof Error ? error.message : String(error)
      });

      if (axios.isAxiosError(error)) {
        logger.error('[Codeforces] Axios error on submission', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message;
        throw new Error(`Failed to submit to Codeforces: ${errorMsg}`);
      }
      throw new Error('Failed to submit problem to Codeforces');
    }
  }

  /**
   * Get problem information from Codeforces
   * @param contestId Contest ID
   * @param problemId Problem ID (e.g., "A", "B")
   * @returns Promise with problem details
   */
  async getProblem(contestId: string, problemId: string): Promise<CodeForcesProblem> {
    try {
      logger.info('[Codeforces] Fetching problem details', {
        contestId,
        problemId
      });

      // TODO: Call Codeforces API to get problem details
      // This endpoint should return:
      // - Problem title
      // - Time limit
      // - Memory limit
      // - Problem statement and samples

      const problem: CodeForcesProblem = {
        contestId: parseInt(contestId),
        problemId,
        title: `Problem ${problemId}`
        // timeLimit, memoryLimit, input, output will be populated from API
      };

      logger.info('[Codeforces] Problem details fetched', {
        contestId,
        problemId,
        title: problem.title
      });

      return problem;
    } catch (error) {
      logger.error('[Codeforces] Error fetching problem', {
        contestId,
        problemId,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new Error(`Failed to fetch problem ${problemId} from contest ${contestId}`);
    }
  }

  /**
   * Get submission status from Codeforces
   * @param submissionId Submission ID
   * @returns Promise with submission verdict and metrics
   */
  async getSubmissionStatus(submissionId: string): Promise<CodeForcesSubmissionResponse> {
    try {
      logger.debug('[Codeforces] Checking submission status', { submissionId });

      const response = await this.axiosInstance.get(`/api/status/${submissionId}`);
      const data = response.data;
      
      if (!data.success) {
        throw new Error('Failed to get submission status');
      }

      const status = data.status;
      const verdict = this.mapCodeforcesVerdict(status.verdict);
      
      // Parse execution time (e.g., "125 ms" -> 125)
      let executionTimeMs = 0;
      if (status.time) {
        const timeMatch = status.time.match(/(\d+)\s*ms/i);
        if (timeMatch) {
          executionTimeMs = parseInt(timeMatch[1], 10);
        }
      }
      
      // Parse memory (e.g., "2048 KB" -> 2048)
      let memoryUsedKb = 0;
      if (status.memory) {
        const memoryMatch = status.memory.match(/(\d+)\s*[KM]B/i);
        if (memoryMatch) {
          const value = parseInt(memoryMatch[1], 10);
          memoryUsedKb = status.memory.includes('MB') ? value * 1024 : value;
        }
      }

      const passed = verdict === JudgeVerdict.ACCEPTED;

      logger.debug('[Codeforces] Status retrieved', {
        submissionId,
        verdict,
        executionTimeMs,
        memoryUsedKb
      });

      return {
        submissionId,
        verdict,
        executionTimeMs,
        memoryUsedKb,
        output: '',
        passed
      };
      
    } catch (error) {
      logger.error('[Codeforces] Error checking submission status', {
        submissionId,
        error: error instanceof Error ? error.message : String(error)
      });

      if (axios.isAxiosError(error)) {
        logger.error('[Codeforces] Axios error checking status', {
          submissionId,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message;
        throw new Error(`Failed to get submission status: ${errorMsg}`);
      }
      throw new Error('Failed to get submission status from Codeforces');
    }
  }

  /**
   * Wait for submission to complete
   * @param submissionId Submission ID
   * @param maxAttempts Maximum number of polling attempts
   * @param intervalMs Interval between polling attempts in milliseconds
   * @returns Promise with final submission verdict
   */
  async waitForSubmission(
    submissionId: string,
    maxAttempts: number = 60,
    intervalMs: number = 1000
  ): Promise<CodeForcesSubmissionResponse> {
    logger.info('[Codeforces] Waiting for submission completion', {
      submissionId,
      maxAttempts,
      intervalMs
    });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getSubmissionStatus(submissionId);

      logger.debug('[Codeforces] Status check attempt', {
        submissionId,
        attempt: attempt + 1,
        maxAttempts,
        verdict: status.verdict
      });

      // Check if verdict is final (not in progress)
      // In Codeforces, final verdicts are actual results, not pending states
      if (status.verdict && ![JudgeVerdict.ACCEPTED, JudgeVerdict.WRONG_ANSWER, JudgeVerdict.TIME_LIMIT_EXCEEDED, JudgeVerdict.RUNTIME_ERROR, JudgeVerdict.COMPILATION_ERROR].includes(status.verdict)) {
        logger.info('[Codeforces] Submission completed', {
          submissionId,
          verdict: status.verdict,
          attempts: attempt + 1,
          totalTimeMs: (attempt + 1) * intervalMs
        });
        return status;
      }

      if (attempt < maxAttempts - 1) {
        await this.sleep(intervalMs);
      }
    }

    logger.error('[Codeforces] Timeout waiting for submission', {
      submissionId,
      maxAttempts,
      totalWaitTimeMs: maxAttempts * intervalMs
    });

    throw new Error(`Timeout waiting for submission ${submissionId} to complete`);
  }

  /**
   * Submit multiple problems in batch
   * @param submissions Array of submission requests
   * @returns Promise with array of submission IDs
   */
  async submitBatch(
    submissions: CodeForcesSubmissionRequest[]
  ): Promise<string[]> {
    try {
      logger.info('[Codeforces] Submitting batch of problems', {
        batchSize: submissions.length
      });

      const submissionIds: string[] = [];

      // Submit each problem sequentially to avoid rate limiting
      for (const submission of submissions) {
        const result = await this.submitProblem(submission);
        submissionIds.push(result.submissionId);
      }

      logger.info('[Codeforces] Batch submissions created', {
        batchSize: submissionIds.length,
        submissionIds: submissionIds.slice(0, 5).concat(submissionIds.length > 5 ? [`... +${submissionIds.length - 5} more`] : [])
      });

      return submissionIds;
    } catch (error) {
      logger.error('[Codeforces] Error submitting batch', {
        batchSize: submissions.length,
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }

  /**
   * Wait for multiple submissions to complete with progress callback
   * @param submissionIds Array of submission IDs
   * @param onProgress Callback for progress updates
   * @param maxAttempts Maximum number of polling attempts
   * @param intervalMs Interval between polling attempts in milliseconds
   * @returns Promise with array of final submission responses
   */
  async waitForBatchWithCallback(
    submissionIds: string[],
    onProgress: (progress: {
      completed: number;
      pending: number;
      total: number;
      percentage: number;
      statuses: CodeForcesSubmissionResponse[];
    }) => Promise<void>,
    maxAttempts: number = 60,
    intervalMs: number = 1000
  ): Promise<CodeForcesSubmissionResponse[]> {
    logger.info('[Codeforces] Waiting for batch submissions with progress callback', {
      batchSize: submissionIds.length,
      maxAttempts,
      intervalMs
    });

    const completedStatuses: Map<string, CodeForcesSubmissionResponse> = new Map();
    const pendingIds = new Set(submissionIds);

    for (let attempt = 0; attempt < maxAttempts && pendingIds.size > 0; attempt++) {
      const currentStatuses: CodeForcesSubmissionResponse[] = [];

      for (const id of Array.from(pendingIds)) {
        try {
          const status = await this.getSubmissionStatus(id);
          currentStatuses.push(status);

          // Check if verdict is final (completed)
          if (status.verdict && [JudgeVerdict.ACCEPTED, JudgeVerdict.WRONG_ANSWER, JudgeVerdict.TIME_LIMIT_EXCEEDED, JudgeVerdict.RUNTIME_ERROR, JudgeVerdict.COMPILATION_ERROR].includes(status.verdict)) {
            completedStatuses.set(id, status);
            pendingIds.delete(id);
          }
        } catch (error) {
          logger.warn('[Codeforces] Error checking status in batch', {
            submissionId: id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const completed = completedStatuses.size;
      const pending = pendingIds.size;
      const total = submissionIds.length;
      const percentage = Math.round((completed / total) * 100);

      logger.debug('[Codeforces] Batch progress', {
        attempt: attempt + 1,
        completed,
        pending,
        total,
        percentage
      });

      await onProgress({
        completed,
        pending,
        total,
        percentage,
        statuses: currentStatuses
      });

      if (pendingIds.size === 0) {
        logger.info('[Codeforces] All submissions completed', {
          total,
          completedIn: (attempt + 1) * intervalMs
        });
        return Array.from(completedStatuses.values());
      }

      if (attempt < maxAttempts - 1) {
        await this.sleep(intervalMs);
      }
    }

    logger.warn('[Codeforces] Batch processing timeout', {
      completed: completedStatuses.size,
      pending: pendingIds.size,
      total: submissionIds.length
    });

    return Array.from(completedStatuses.values());
  }

  /**
   * Helper method to wait
   * @param ms Milliseconds to wait
   * @returns Promise that resolves after specified time
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
