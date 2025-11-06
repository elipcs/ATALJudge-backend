import { SubmissionRepository, SubmissionResultRepository, QuestionRepository, TestCaseRepository, QuestionListRepository } from '../repositories';
import { CreateSubmissionDTO, SubmissionResponseDTO, SubmissionDetailDTO, TestCaseResultDTO } from '../dtos';
import { SubmissionStatus, JudgeVerdict, ProgrammingLanguage } from '../enums';
import { Judge0Service } from './Judge0Service';
import { SubmissionQueueService } from './SubmissionQueueService';
import { GradeService } from './GradeService';
import { logger, NotFoundError, ValidationError } from '../utils';

export class SubmissionService {
  private submissionRepository: SubmissionRepository;
  private submissionResultRepository: SubmissionResultRepository;
  private questionRepository: QuestionRepository;
  private testCaseRepository: TestCaseRepository;
  private questionListRepository: QuestionListRepository;
  private judge0Service: Judge0Service;
  private gradeService: GradeService;
  private queueService?: SubmissionQueueService;

  constructor(
    submissionRepository: SubmissionRepository,
    submissionResultRepository: SubmissionResultRepository,
    questionRepository: QuestionRepository,
    testCaseRepository: TestCaseRepository,
    judge0Service: Judge0Service,
    gradeService: GradeService,
    questionListRepository: QuestionListRepository,
    queueService?: SubmissionQueueService
  ) {
    this.submissionRepository = submissionRepository;
    this.submissionResultRepository = submissionResultRepository;
    this.questionRepository = questionRepository;
    this.testCaseRepository = testCaseRepository;
    this.judge0Service = judge0Service;
    this.gradeService = gradeService;
    this.questionListRepository = questionListRepository;
    this.queueService = queueService;
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
    logger.info('Buscando submissões com filtros', { filters });
    
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
    
    logger.info('Submissões encontradas', { count: submissions.length, total, page, totalPages });
    
    const submissionsDTO = submissions.map(sub => new SubmissionResponseDTO({
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
      updatedAt: sub.updatedAt,
      // Dados do autor
      userName: sub.user?.name,
      userEmail: sub.user?.email,
      studentRegistration: (sub.user as any)?.studentRegistration,
      // Dados da questão
      questionName: sub.question?.title,
      // Dados da lista
      listId: (sub as any).listId,
      listName: (sub as any).listTitle
    }));

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
    logger.info('Buscando submissão por ID', { submissionId: id, requestUserId });
    
    const submission = await this.submissionRepository.findById(id);
    
    if (!submission) {
      logger.warn('Submissão não encontrada', { submissionId: id });
      throw new NotFoundError('Submissão não encontrada', 'SUBMISSION_NOT_FOUND');
    }
    
    // Se requestUserId for fornecido (aluno), verificar se a submissão pertence a ele
    if (requestUserId && submission.userId !== requestUserId) {
      logger.warn('Usuário tentou acessar submissão de outro usuário', { 
        submissionId: id, 
        submissionUserId: submission.userId,
        requestUserId 
      });
      throw new NotFoundError('Submissão não encontrada', 'SUBMISSION_NOT_FOUND');
    }
    
    logger.info('Submissão recuperada', { submissionId: id, status: submission.status });
    
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
    logger.info('Criando nova submissão', { userId, questionId: data.questionId, language: data.language });
    
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

    logger.info('Submissão criada com sucesso', { submissionId: submission.id, status: submission.status });

    if (this.queueService) {
      logger.info('Adicionando submissão à fila', { submissionId: submission.id });
      
      await this.submissionRepository.update(submission.id, {
        status: SubmissionStatus.IN_QUEUE
      });

      await this.queueService.addSubmissionToQueue(submission.id);
      
      logger.info('Submissão adicionada à fila', { submissionId: submission.id });
    } else {
      logger.warn('Sistema de fila não disponível, processando diretamente', { submissionId: submission.id });
      
      this.processSubmission(submission.id).catch(error => {
        logger.error('Erro ao processar submissão em background', { 
          submissionId: submission.id, 
          error: error instanceof Error ? error.message : String(error) 
        });
      });
    }
    
    return new SubmissionResponseDTO({
      id: submission.id,
      userId: submission.userId,
      questionId: submission.questionId,
      code: submission.code,
      language: submission.language,
      status: this.queueService ? SubmissionStatus.IN_QUEUE : submission.status,
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
    logger.info('Iniciando submissão de código', { 
      userId: data.userId, 
      questionId: data.questionId, 
      language: data.language,
      codeLength: data.code.length 
    });
    
    if (!Object.values(ProgrammingLanguage).includes(data.language as ProgrammingLanguage)) {
      logger.warn('Linguagem de programação inválida', { language: data.language });
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

    logger.info('Submissão registrada no banco de dados', { submissionId: submission.id });

    // Disparar processamento como em createSubmission
    if (this.queueService) {
      logger.info('Adicionando submissão à fila (via /submit)', { submissionId: submission.id });
      await this.submissionRepository.update(submission.id, {
        status: SubmissionStatus.IN_QUEUE
      });
      await this.queueService.addSubmissionToQueue(submission.id);
      logger.info('Submissão adicionada à fila (via /submit)', { submissionId: submission.id });
      submission.status = SubmissionStatus.IN_QUEUE;
    } else {
      logger.warn('Sistema de fila não disponível, processando diretamente (via /submit)', { submissionId: submission.id });
      this.processSubmission(submission.id).catch(error => {
        logger.error('Erro ao processar submissão em background (via /submit)', { 
          submissionId: submission.id, 
          error: error instanceof Error ? error.message : String(error) 
        });
      });
    }

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
    logger.info('Buscando submissões de uma questão', { questionId, userId });
    const result = await this.getSubmissions({ questionId, userId });
    return result.submissions;
  }

  async getUserSubmissions(userId: string, limit: number = 10): Promise<SubmissionResponseDTO[]> {
    logger.info('Buscando submissões de um usuário', { userId, limit });
    const result = await this.getSubmissions({ userId, limit });
    return result.submissions;
  }

  async processSubmission(submissionId: string): Promise<void> {
    try {
      logger.info('=== INÍCIO DO PROCESSAMENTO DE SUBMISSÃO ===', { submissionId });

      const submission = await this.submissionRepository.findById(submissionId);
      if (!submission) {
        logger.error('Submissão não encontrada no banco', { submissionId });
        throw new Error('Submissão não encontrada');
      }

      logger.info('Submissão recuperada', { 
        submissionId, 
        userId: submission.userId, 
        questionId: submission.questionId,
        language: submission.language 
      });

      logger.debug('Atualizando status para PROCESSING', { submissionId });
      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.PROCESSING
      });

      logger.info('Buscando questão associada', { submissionId, questionId: submission.questionId });
      const question = await this.questionRepository.findWithTestCases(submission.questionId);
      if (!question) {
        logger.error('Questão não encontrada', { submissionId, questionId: submission.questionId });
        throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
      }

      logger.info('Questão encontrada', { 
        submissionId, 
        questionId: question.id,
        submissionType: question.submissionType 
      });

      if (question.submissionType !== 'local') {
        logger.warn('Tipo de questão não suportado', { submissionId, submissionType: question.submissionType });
        throw new ValidationError('Apenas questões locais podem ser processadas', 'INVALID_QUESTION_TYPE');
      }

      logger.debug('Buscando casos de teste', { submissionId, questionId: question.id });
      const testCases = await this.testCaseRepository.findByQuestion(question.id);
      if (testCases.length === 0) {
        logger.error('Questão sem casos de teste', { submissionId, questionId: question.id });
        throw new ValidationError('Questão não possui casos de teste', 'NO_TEST_CASES');
      }

      logger.info('Casos de teste carregados', { 
        submissionId, 
        totalTestCases: testCases.length,
        testCaseIds: testCases.map(tc => tc.id)
      });

      const limits = {
        cpuTimeLimit: question.getCpuTimeLimitSeconds(),
        memoryLimit: question.getMemoryLimitKb(),
        wallTimeLimit: question.getWallTimeLimitSeconds()
      };

      logger.info('Limites de execução definidos', { 
        submissionId, 
        limits 
      });

      const batchSubmissions = testCases.map(testCase => ({
        sourceCode: submission.code,
        language: submission.language,
        stdin: testCase.input,
        expectedOutput: testCase.expectedOutput
      }));

      logger.info('Enviando lote para Judge0', { 
        submissionId, 
        batchSize: batchSubmissions.length,
        language: submission.language
      });

      const tokens = await this.judge0Service.createBatchSubmissions(
        batchSubmissions,
        limits
      );

      logger.info('Tokens recebidos do Judge0, atualizando status para RUNNING', { 
        submissionId,
        tokenCount: tokens.length
      });

      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.RUNNING
      });

      const results = await this.judge0Service.waitForBatchSubmissionsWithCallback(
        tokens,
        async (progress) => {
          logger.debug('Progresso da execução no Judge0', {
            submissionId,
            completed: progress.completed,
            pending: progress.pending,
            percentage: progress.percentage
          });

          // Pode atualizar informações adicionais no banco se necessário
          // Por exemplo, um campo de progresso ou logs
        }
      );

      logger.info('Resultados do Judge0 recebidos', { 
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

      logger.debug('Processando resultados individuais dos casos de teste', { submissionId });

      for (let i = 0; i < results.length; i++) {
        const judge0Result = results[i];
        const testCase = testCases[i];
        const processedResult = this.judge0Service.processSubmissionResult(
          judge0Result,
          testCase.expectedOutput
        );

        logger.debug('Resultado de caso de teste processado', {
          submissionId,
          testCaseIndex: i,
          testCaseId: testCase.id,
          verdict: processedResult.verdict,
          passed: processedResult.passed,
          executionTimeMs: processedResult.executionTimeMs,
          memoryUsedKb: processedResult.memoryUsedKb
        });

        if (processedResult.verdict === JudgeVerdict.COMPILATION_ERROR) {
          hasCompilationError = true;
          compilationError = processedResult.errorMessage || 'Erro de compilação';
          logger.error('Erro de compilação detectado', {
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

      logger.info('Resumo do processamento dos resultados', {
        submissionId,
        totalTestCases: testCases.length,
        passedTests,
        totalExecutionTime,
        maxMemory,
        hasCompilationError
      });

      logger.debug('Salvando resultados no banco de dados', { submissionId });
      await this.submissionResultRepository.createMany(submissionResults);
      logger.debug('Resultados salvos com sucesso', { submissionId });

      const totalWeight = testCases.reduce((sum, tc) => sum + tc.weight, 0);
      const earnedWeight = testCases.reduce((sum, tc, index) => {
        return sum + (submissionResults[index].passed ? tc.weight : 0);
      }, 0);

      const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

      logger.info('Pontuação calculada', {
        submissionId,
        totalWeight,
        earnedWeight,
        finalScore: score
      });

      let finalVerdict = '';
      let finalStatus = SubmissionStatus.COMPLETED;

      if (hasCompilationError) {
        finalVerdict = JudgeVerdict.COMPILATION_ERROR;
        finalStatus = SubmissionStatus.COMPLETED;
        logger.warn('Submissão com erro de compilação', { submissionId, verdict: finalVerdict });
      } else if (passedTests === testCases.length) {
        finalVerdict = JudgeVerdict.ACCEPTED;
        logger.info('Todos os testes passaram', { submissionId, verdict: finalVerdict });
      } else {
        const failedResult = submissionResults.find(r => !r.passed);
        finalVerdict = failedResult?.verdict || JudgeVerdict.WRONG_ANSWER;
        logger.info('Submissão com falhas em testes', { submissionId, verdict: finalVerdict, failedCount: testCases.length - passedTests });
      }

      logger.debug('Atualizando submissão no banco com resultados finais', { submissionId });
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

      // Atualizar nota do aluno após conclusão bem-sucedida da submissão
      try {
        logger.debug('Atualizando nota do aluno', { submissionId, studentId: submission.userId });
        
        const questionList = await this.questionListRepository.findByQuestionId(submission.questionId);
        if (questionList) {
          await this.gradeService.recalculateAndUpsertGrade(
            submission.userId,
            questionList.id
          );
          
          logger.info('Nota do aluno recalculada e atualizada com sucesso', {
            submissionId,
            studentId: submission.userId,
            listId: questionList.id
          });
        } else {
          logger.warn('Questão não está associada a nenhuma lista de questões', { 
            submissionId, 
            questionId: submission.questionId 
          });
        }
      } catch (gradeError) {
        logger.error('Erro ao atualizar nota do aluno', {
          submissionId,
          studentId: submission.userId,
          errorMessage: gradeError instanceof Error ? gradeError.message : String(gradeError)
        });
        // Não lançar erro para não interromper o processamento da submissão
      }

      logger.info('=== PROCESSAMENTO DE SUBMISSÃO CONCLUÍDO COM SUCESSO ===', {
        submissionId,
        status: finalStatus,
        score,
        totalTests: testCases.length,
        passedTests,
        verdict: finalVerdict,
        executionTimeMs: totalExecutionTime,
        memoryUsedKb: maxMemory
      });

    } catch (error) {
      logger.error('=== ERRO DURANTE PROCESSAMENTO DE SUBMISSÃO ===', { 
        submissionId, 
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });

      try {
        await this.submissionRepository.update(submissionId, {
          status: SubmissionStatus.ERROR,
          errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        logger.debug('Submissão atualizada com status ERROR', { submissionId });
      } catch (updateError) {
        logger.error('Falha ao atualizar submissão com status ERROR', {
          submissionId,
          updateError: updateError instanceof Error ? updateError.message : String(updateError)
        });
      }

      throw error;
    }
  }

  async getSubmissionWithResults(submissionId: string, requestUserId?: string): Promise<SubmissionDetailDTO> {
    logger.info('Buscando submissão com resultados detalhados', { submissionId, requestUserId });
    
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) {
      logger.warn('Submissão com resultados não encontrada', { submissionId });
      throw new NotFoundError('Submissão não encontrada', 'SUBMISSION_NOT_FOUND');
    }

    // Se requestUserId for fornecido (aluno), verificar se a submissão pertence a ele
    if (requestUserId && submission.userId !== requestUserId) {
      logger.warn('Usuário tentou acessar resultados de submissão de outro usuário', { 
        submissionId, 
        submissionUserId: submission.userId,
        requestUserId 
      });
      throw new NotFoundError('Submissão não encontrada', 'SUBMISSION_NOT_FOUND');
    }

    logger.debug('Buscando resultados de testes', { submissionId });
    const results = await this.submissionResultRepository.findBySubmission(submissionId);

    logger.info('Resultados de testes recuperados', {
      submissionId,
      testCount: results.length
    });

    const testResults = results.map(result => new TestCaseResultDTO({
      testCaseId: result.testCaseId,
      verdict: result.verdict,
      passed: result.passed,
      executionTimeMs: result.executionTimeMs,
      memoryUsedKb: result.memoryUsedKb,
      // Não enviamos input nem expectedOutput para proteger os testes
      actualOutput: result.output,
      errorMessage: result.errorMessage
    }));

    logger.info('Detalhes da submissão compilados', {
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

