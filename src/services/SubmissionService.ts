/**
 * @module services/SubmissionService
 * @description Service for managing and processing code submissions.
 * 
 * This service handles:
 * - Creating and retrieving submissions
 * - Processing submissions with test cases
 * - Communicating with Judge0 API
 * - Managing submission queue
 * - Calculating scores based on test results
 * - Updating grades after submission
 */

import { injectable, inject } from 'tsyringe';
import { SubmissionRepository, SubmissionResultRepository, QuestionRepository, TestCaseRepository, QuestionListRepository } from '../repositories';
import { CreateSubmissionDTO, SubmissionResponseDTO, SubmissionDetailDTO, TestCaseResultDTO } from '../dtos';
import { SubmissionStatus, JudgeVerdict, ProgrammingLanguage } from '../enums';
import { Judge0Service } from './Judge0Service';
import { SubmissionQueueService } from './SubmissionQueueService';
import { GradeService } from './GradeService';
import { logger, NotFoundError, ValidationError } from '../utils';
import { SubmissionMapper } from '../mappers';
import { config } from '../config';

/**
 * Service for submission management and processing.
 * @class SubmissionService
 */
@injectable()
export class SubmissionService {
  constructor(
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository,
    @inject(SubmissionResultRepository) private submissionResultRepository: SubmissionResultRepository,
    @inject(QuestionRepository) private questionRepository: QuestionRepository,
    @inject(TestCaseRepository) private testCaseRepository: TestCaseRepository,
    @inject(Judge0Service) private judge0Service: Judge0Service,
    @inject(GradeService) private gradeService: GradeService,
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository,
    @inject('SubmissionQueueService') private queueService?: SubmissionQueueService
  ) { }


  private async enqueueOrProcessSubmission(submissionId: string): Promise<SubmissionStatus> {
    if (this.queueService) {
      logger.info('Adicionando submissão à fila', { submissionId });

      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.IN_QUEUE
      });

      await this.queueService.addSubmissionToQueue(submissionId);

      logger.info('Submission added to queue', { submissionId });
      return SubmissionStatus.IN_QUEUE;
    } else {
      logger.warn('Queue system not available, processing directly', { submissionId });

      this.processSubmission(submissionId).catch(error => {
        logger.error('Error processing submission in background', {
          submissionId,
          error: error instanceof Error ? error.message : String(error)
        });
      });

      return SubmissionStatus.PENDING;
    }
  }

  async getSubmissions(filters: {
    questionId?: string;
    userId?: string;
    status?: SubmissionStatus;
    verdict?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    submissions: SubmissionResponseDTO[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { submissions, total } = await this.submissionRepository.findByFilters({
      questionId: filters.questionId,
      userId: filters.userId,
      status: filters.status,
      verdict: filters.verdict,
      page: filters.page || 1,
      limit: filters.limit || 20
    });

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    const submissionsDTO = submissions.map(sub => SubmissionMapper.toDTO(sub));

    return {
      submissions: submissionsDTO,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  async getSubmissionById(id: string, requestUserId?: string): Promise<SubmissionResponseDTO> {
    const submission = await this.submissionRepository.findById(id);

    if (!submission) {
      logger.warn('Submission not found', { submissionId: id });
      throw new NotFoundError('Submission not found', 'SUBMISSION_NOT_FOUND');
    }

    if (requestUserId && submission.userId !== requestUserId) {
      logger.warn('Access denied to another user\'s submission', {
        submissionId: id,
        requestUserId
      });
      throw new NotFoundError('Submission not found', 'SUBMISSION_NOT_FOUND');
    }

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

  async createSubmission(data: CreateSubmissionDTO, userId: string): Promise<SubmissionResponseDTO> {
    const submission = await this.submissionRepository.create({
      userId,
      questionId: data.questionId,
      code: data.code,
      language: data.language,
      status: SubmissionStatus.PENDING,
      score: 0,
      totalTests: 0,
      passedTests: 0
    });

    logger.info('Submission created', { submissionId: submission.id, userId, questionId: data.questionId });

    const finalStatus = await this.enqueueOrProcessSubmission(submission.id);

    return new SubmissionResponseDTO({
      id: submission.id,
      userId: submission.userId,
      questionId: submission.questionId,
      code: submission.code,
      language: submission.language,
      status: finalStatus,
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

  async submitCode(data: {
    questionId: string;
    code: string;
    language: string;
    userId: string;
  }): Promise<any> {
    logger.info('Starting code submission', {
      userId: data.userId,
      questionId: data.questionId,
      language: data.language,
      codeLength: data.code.length
    });

    if (!Object.values(ProgrammingLanguage).includes(data.language as ProgrammingLanguage)) {
      logger.warn('Invalid programming language', { language: data.language });
      throw new ValidationError('Invalid programming language', 'INVALID_LANGUAGE');
    }

    const submission = await this.submissionRepository.create({
      userId: data.userId,
      questionId: data.questionId,
      code: data.code,
      language: data.language as ProgrammingLanguage,
      status: SubmissionStatus.PENDING,
      score: 0,
      totalTests: 0,
      passedTests: 0
    });

    logger.info('Submission registered in database', { submissionId: submission.id });

    const finalStatus = await this.enqueueOrProcessSubmission(submission.id);
    submission.status = finalStatus;

    return {
      submissionId: submission.id,
      id: submission.id,
      questionId: submission.questionId,
      userId: submission.userId,
      language: submission.language,
      code: submission.code,
      sourceCode: submission.code,
      status: submission.status,
      score: submission.score,
      totalScore: submission.score,
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString()
    };
  }

  async getQuestionSubmissions(questionId: string, userId?: string): Promise<SubmissionResponseDTO[]> {
    logger.info('Fetching submissions for a question', { questionId, userId });
    const result = await this.getSubmissions({ questionId, userId });
    return result.submissions;
  }

  async getUserSubmissions(userId: string, limit: number = 10): Promise<SubmissionResponseDTO[]> {
    logger.info('Fetching submissions for a user', { userId, limit });
    const result = await this.getSubmissions({ userId, limit });
    return result.submissions;
  }

  async processSubmission(submissionId: string): Promise<void> {
    try {
      logger.info('=== SUBMISSION PROCESSING START ===', { submissionId });

      const submission = await this.submissionRepository.findById(submissionId);
      if (!submission) {
        logger.error('Submission not found', { submissionId });
        throw new Error('Submission not found');
      }

      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.PROCESSING
      });

      const question = await this.questionRepository.findWithTestCases(submission.questionId);
      if (!question) {
        logger.error('Question not found', { submissionId, questionId: submission.questionId });
        throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
      }

      logger.debug('Fetching test cases', { submissionId, questionId: question.id });
      const testCases = await this.testCaseRepository.findByQuestion(question.id);
      if (testCases.length === 0) {
        logger.error('Question without test cases', { submissionId, questionId: question.id });
        throw new ValidationError('Question does not have test cases', 'NO_TEST_CASES');
      }

      logger.info('Test cases loaded', {
        submissionId,
        totalTestCases: testCases.length,
        testCaseIds: testCases.map(tc => tc.id)
      });

      const limits = {
        cpuTimeLimit: question.getCpuTimeLimitSeconds(),
        memoryLimit: question.getMemoryLimitKb(),
        wallTimeLimit: config.limits.defaultWallTimeLimit
      };

      const batchSubmissions = testCases.map(testCase => ({
        sourceCode: submission.code,
        language: submission.language,
        stdin: testCase.input,
        expectedOutput: testCase.expectedOutput
      }));

      logger.info('Sending submission to Judge0', {
        submissionId,
        testCases: batchSubmissions.length
      });

      const tokens = await this.judge0Service.createBatchSubmissions(
        batchSubmissions,
        limits
      );

      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.RUNNING
      });

      const results = await this.judge0Service.waitForBatchSubmissionsWithCallback(
        tokens,
        async (_progress) => {
        }
      );

      logger.info('Judge0 results received', {
        submissionId,
        resultCount: results.length
      });

      const submissionResults: Array<{
        submissionId: string;
        testCaseId: string;
        verdict: JudgeVerdict;
        executionTimeMs?: number;
        memoryUsedKb?: number;
        output?: string;
        errorMessage?: string;
        passed: boolean;
      }> = [];
      let passedTests = 0;
      let totalExecutionTime = 0;
      let maxMemory = 0;
      let hasCompilationError = false;
      let compilationError = '';

      for (let i = 0; i < results.length; i++) {
        const judge0Result = results[i];
        const testCase = testCases[i];
        const processedResult = this.judge0Service.processSubmissionResult(
          judge0Result,
          testCase.expectedOutput
        );

        if (processedResult.verdict === JudgeVerdict.COMPILATION_ERROR) {
          hasCompilationError = true;
          compilationError = processedResult.errorMessage || 'Compilation error';
          logger.error('Compilation error detected', {
            submissionId,
            errorMessage: compilationError
          });
        }

        submissionResults.push({
          submissionId: submission.id,
          testCaseId: testCase.id,
          verdict: processedResult.verdict,
          executionTimeMs: processedResult.executionTimeMs,
          memoryUsedKb: processedResult.memoryUsedKb,
          output: processedResult.output,
          errorMessage: processedResult.errorMessage,
          passed: processedResult.passed
        });

        if (processedResult.passed) {
          passedTests++;
        }

        if (processedResult.executionTimeMs) {
          totalExecutionTime += processedResult.executionTimeMs;
        }

        if (processedResult.memoryUsedKb && processedResult.memoryUsedKb > maxMemory) {
          maxMemory = processedResult.memoryUsedKb;
        }
      }

      logger.info('Processing results summary', {
        submissionId,
        totalTestCases: testCases.length,
        passedTests,
        totalExecutionTime,
        maxMemory,
        hasCompilationError
      });

      await this.submissionResultRepository.createMany(submissionResults);

      const totalWeight = testCases.reduce((sum, tc) => sum + tc.weight, 0);
      const earnedWeight = testCases.reduce((sum, tc, index) => {
        return sum + (submissionResults[index].passed ? tc.weight : 0);
      }, 0);

      const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

      let finalVerdict = '';
      let finalStatus = SubmissionStatus.COMPLETED;

      if (hasCompilationError) {
        finalVerdict = JudgeVerdict.COMPILATION_ERROR;
        finalStatus = SubmissionStatus.COMPLETED;
        logger.warn('Compilation error', { submissionId });
      } else if (passedTests === testCases.length) {
        finalVerdict = JudgeVerdict.ACCEPTED;
      } else {
        const failedResult = submissionResults.find(r => !r.passed);
        finalVerdict = failedResult?.verdict || JudgeVerdict.WRONG_ANSWER;
      }

      await this.submissionRepository.update(submissionId, {
        status: finalStatus,
        score,
        totalTests: testCases.length,
        passedTests,
        executionTimeMs: totalExecutionTime,
        memoryUsedKb: maxMemory,
        verdict: finalVerdict,
        errorMessage: hasCompilationError ? compilationError : undefined
      });

      try {
        const questionList = await this.questionListRepository.findByQuestionId(submission.questionId);
        if (questionList) {
          await this.gradeService.recalculateAndUpsertGrade(
            submission.userId,
            questionList.id
          );

          logger.info('Grade updated', {
            submissionId,
            studentId: submission.userId,
            questionListId: questionList.id
          });
        } else {
          logger.warn('Question not associated with list', {
            submissionId,
            questionId: submission.questionId
          });
        }
      } catch (gradeError) {
        logger.error('Error updating grade', {
          submissionId,
          studentId: submission.userId,
          error: gradeError instanceof Error ? gradeError.message : String(gradeError)
        });
      }

      logger.info('Submission processed', {
        submissionId,
        verdict: finalVerdict,
        score,
        passedTests,
        totalTests: testCases.length
      });

    } catch (error) {
      logger.error('Error processing submission', {
        submissionId,
        error: error instanceof Error ? error.message : String(error)
      });

      try {
        await this.submissionRepository.update(submissionId, {
          status: SubmissionStatus.ERROR,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        logger.debug('Submission updated with ERROR status', { submissionId });
      } catch (updateError) {
        logger.error('Failed to update submission with ERROR status', {
          submissionId,
          updateError: updateError instanceof Error ? updateError.message : String(updateError)
        });
      }

      throw error;
    }
  }



  async getSubmissionWithResults(submissionId: string, requestUserId?: string): Promise<SubmissionDetailDTO> {
    logger.info('Fetching submission with detailed results', { submissionId, requestUserId });

    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) {
      logger.warn('Submission with results not found', { submissionId });
      throw new NotFoundError('Submission not found', 'SUBMISSION_NOT_FOUND');
    }

    if (requestUserId && submission.userId !== requestUserId) {
      logger.warn('User tried to access another user\'s submission results', {
        submissionId,
        submissionUserId: submission.userId,
        requestUserId
      });
      throw new NotFoundError('Submission not found', 'SUBMISSION_NOT_FOUND');
    }

    logger.debug('Fetching test results', { submissionId });
    const results = await this.submissionResultRepository.findBySubmission(submissionId);

    logger.info('Test results retrieved', {
      submissionId,
      testCount: results.length
    });

    const testResults = results.map(result => new TestCaseResultDTO({
      testCaseId: result.testCaseId,
      verdict: result.verdict,
      passed: result.passed,
      executionTimeMs: result.executionTimeMs,
      memoryUsedKb: result.memoryUsedKb,
      actualOutput: result.output,
      errorMessage: result.errorMessage
    }));

    logger.info('Submission details compiled', {
      submissionId,
      score: submission.score,
      verdict: submission.verdict,
      testsPassed: testResults.filter(r => r.passed).length,
      totalTests: testResults.length
    });

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
}

