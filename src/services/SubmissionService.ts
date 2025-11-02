import { SubmissionRepository, SubmissionResultRepository, QuestionRepository, TestCaseRepository } from '../repositories';
import { CreateSubmissionDTO, SubmissionResponseDTO, SubmissionDetailDTO, TestCaseResultDTO, HiddenTestsSummaryDTO } from '../dtos';
import { SubmissionStatus, JudgeVerdict, ProgrammingLanguage } from '../enums';
import { Judge0Service } from './Judge0Service';
import { LocalQuestion } from '../models/LocalQuestion';
import { logger, NotFoundError, ValidationError } from '../utils';

export class SubmissionService {
  private submissionRepository: SubmissionRepository;
  private submissionResultRepository: SubmissionResultRepository;
  private questionRepository: QuestionRepository;
  private testCaseRepository: TestCaseRepository;
  private judge0Service: Judge0Service;

  constructor(
    submissionRepository: SubmissionRepository,
    submissionResultRepository: SubmissionResultRepository,
    questionRepository: QuestionRepository,
    testCaseRepository: TestCaseRepository,
    judge0Service: Judge0Service
  ) {
    this.submissionRepository = submissionRepository;
    this.submissionResultRepository = submissionResultRepository;
    this.questionRepository = questionRepository;
    this.testCaseRepository = testCaseRepository;
    this.judge0Service = judge0Service;
  }

  async getSubmissions(filters: {
    questionId?: string;
    userId?: string;
    status?: SubmissionStatus;
    limit?: number;
  }): Promise<SubmissionResponseDTO[]> {
    const submissions = await this.submissionRepository.findByFilters({
      questionId: filters.questionId,
      userId: filters.userId,
      status: filters.status,
      limit: filters.limit || 100
    });
    
    return submissions.map(sub => new SubmissionResponseDTO({
      id: sub.id,
      userId: sub.userId,
      questionId: sub.questionId,
      code: sub.code,
      language: sub.language,
      status: sub.status,
      score: sub.score,
      totalTests: sub.totalTests,
      passedTests: sub.passedTests,
      executionTimeMs: sub.executionTimeMs,
      memoryUsedKb: sub.memoryUsedKb,
      verdict: sub.verdict,
      errorMessage: sub.errorMessage,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    }));
  }

  async getSubmissionById(id: string): Promise<SubmissionResponseDTO> {
    const submission = await this.submissionRepository.findById(id);
    
    if (!submission) {
      throw new NotFoundError('Submissão não encontrada', 'SUBMISSION_NOT_FOUND');
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

    this.processSubmission(submission.id).catch(error => {
      logger.error('Erro ao processar submissão', { submissionId: submission.id, error });
    });
    
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

  async submitCode(data: {
    questionId: string;
    code: string;
    language: string;
    userId: string;
  }): Promise<any> {
    
    if (!Object.values(ProgrammingLanguage).includes(data.language as ProgrammingLanguage)) {
      throw new ValidationError('Linguagem de programação inválida', 'INVALID_LANGUAGE');
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
    return this.getSubmissions({ questionId, userId });
  }

  async getUserSubmissions(userId: string, limit: number = 10): Promise<SubmissionResponseDTO[]> {
    return this.getSubmissions({ userId, limit });
  }

  async processSubmission(submissionId: string): Promise<void> {
    try {
      logger.info('Iniciando processamento de submissão', { submissionId });

      const submission = await this.submissionRepository.findById(submissionId);
      if (!submission) {
        throw new Error('Submissão não encontrada');
      }

      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.PROCESSING
      });

      const question = await this.questionRepository.findWithTestCases(submission.questionId);
      if (!question) {
        throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
      }

      if (!(question instanceof LocalQuestion)) {
        throw new ValidationError('Apenas questões locais podem ser processadas', 'INVALID_QUESTION_TYPE');
      }

      const testCases = await this.testCaseRepository.findByQuestion(question.id);
      if (testCases.length === 0) {
        throw new ValidationError('Questão não possui casos de teste', 'NO_TEST_CASES');
      }

      logger.info('Casos de teste encontrados', { 
        submissionId, 
        testCaseCount: testCases.length 
      });

      const limits = {
        cpuTimeLimit: question.getCpuTimeLimitSeconds(),
        memoryLimit: question.getMemoryLimitKb(),
        wallTimeLimit: question.getWallTimeLimitSeconds()
      };

      const batchSubmissions = testCases.map(testCase => ({
        sourceCode: submission.code,
        language: submission.language,
        stdin: testCase.input,
        expectedOutput: testCase.expectedOutput
      }));

      logger.info('Enviando submissões para Judge0', { 
        submissionId, 
        count: batchSubmissions.length 
      });

      const tokens = await this.judge0Service.createBatchSubmissions(
        batchSubmissions,
        limits
      );

      logger.info('Aguardando resultados do Judge0', { submissionId });

      const results = await this.judge0Service.waitForBatchSubmissions(tokens);

      logger.info('Resultados recebidos do Judge0', { 
        submissionId, 
        count: results.length 
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
          compilationError = processedResult.errorMessage || 'Erro de compilação';
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

      logger.info('Submissão processada com sucesso', {
        submissionId,
        score,
        passedTests,
        totalTests: testCases.length,
        verdict: finalVerdict
      });

      console.log('\n[DEBUG] Processamento concluído:');
      console.log(JSON.stringify({
        submissionId,
        status: finalStatus,
        score,
        totalTests: testCases.length,
        passedTests,
        verdict: finalVerdict,
        executionTimeMs: totalExecutionTime,
        memoryUsedKb: maxMemory
      }, null, 2));

    } catch (error) {
      logger.error('Erro ao processar submissão', { submissionId, error });

      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.ERROR,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      throw error;
    }
  }

  async getSubmissionWithResults(submissionId: string): Promise<SubmissionDetailDTO> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundError('Submissão não encontrada', 'SUBMISSION_NOT_FOUND');
    }

    const { sampleResults, hiddenResults } = await this.submissionResultRepository
      .findBySubmissionWithSamples(submissionId);

    const sampleTestResults = sampleResults.map(result => new TestCaseResultDTO({
      testCaseId: result.testCaseId,
      isSample: true,
      verdict: result.verdict,
      passed: result.passed,
      executionTimeMs: result.executionTimeMs,
      memoryUsedKb: result.memoryUsedKb,
      input: result.testCase?.input,
      expectedOutput: result.testCase?.expectedOutput,
      actualOutput: result.output,
      errorMessage: result.errorMessage
    }));

    const hiddenPassed = hiddenResults.filter(r => r.passed).length;
    const hiddenTestsSummary = new HiddenTestsSummaryDTO({
      total: hiddenResults.length,
      passed: hiddenPassed,
      failed: hiddenResults.length - hiddenPassed
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
      sampleTestResults,
      hiddenTestsSummary
    });
  }
}

