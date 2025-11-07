/**
 * @module services/Judge0Service
 * @description Service for integration with Judge0 API (Rapid API).
 * Provides operations to submit code for compilation/execution,
 * check submission status, retrieve execution results
 * and parse Judge0 responses.
 * @class Judge0Service
 */
import { injectable } from 'tsyringe';
import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { JUDGE0_LANGUAGE_IDS, ProgrammingLanguage } from '../enums/ProgrammingLanguage';
import { JudgeVerdict } from '../enums/JudgeVerdict';
import { logger } from '../utils';

export interface Judge0SubmissionRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
  wall_time_limit?: number;
}

export interface Judge0SubmissionResponse {
  token: string;
}

export interface Judge0StatusResponse {
  token: string;
  status: {
    id: number;
    description: string;
  };
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  message?: string;
  time?: string;
  memory?: number;
}

export interface Judge0BatchSubmissionRequest {
  submissions: Judge0SubmissionRequest[];
}

export interface Judge0BatchStatusResponse {
  submissions: Judge0StatusResponse[];
}

export interface ProcessedSubmissionResult {
  verdict: JudgeVerdict;
  passed: boolean;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  output?: string;
  errorMessage?: string;
}

@injectable()
export class Judge0Service {
  private client: AxiosInstance;
  private useBase64: boolean;

  constructor() {
    
    this.useBase64 = true;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (config.judge0.rapidApiKey) {
      headers['X-RapidAPI-Key'] = config.judge0.rapidApiKey;
      headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
      logger.info('[Judge0] Usando Judge0 via RapidAPI');
    } 
    
    else if (config.judge0.apiKey) {
      headers['X-Auth-Token'] = config.judge0.apiKey;
      logger.info('[Judge0] Usando Judge0 local com autenticação');
    }
    
    else {
      logger.info('[Judge0] Usando Judge0 local sem autenticação');
    }

    this.client = axios.create({
      baseURL: config.judge0.url,
      headers,
      timeout: 30000
    });

    logger.info(`[Judge0] Configurado com URL: ${config.judge0.url}`);
  }

  private encodeBase64(str: string): string {
    return Buffer.from(str, 'utf-8').toString('base64');
  }

  private decodeBase64(str: string): string {
    return Buffer.from(str, 'base64').toString('utf-8');
  }

  async createSubmission(
    sourceCode: string,
    language: ProgrammingLanguage,
    stdin?: string,
    expectedOutput?: string,
    limits?: {
      cpuTimeLimit?: number;
      memoryLimit?: number;
      wallTimeLimit?: number;
    }
  ): Promise<string> {
    try {
      logger.info('[Judge0] Criando submissão individual', {
        language,
        codeLength: sourceCode.length,
        hasStdin: !!stdin,
        hasExpectedOutput: !!expectedOutput,
        limits
      });

      const languageId = JUDGE0_LANGUAGE_IDS[language];
      
      if (!languageId) {
        logger.error('[Judge0] Linguagem não suportada', { language });
        throw new Error(`Linguagem ${language} não suportada pelo Judge0`);
      }

      logger.debug('[Judge0] Linguagem mapeada para ID', { language, languageId });

      const submission: Judge0SubmissionRequest = {
        source_code: this.useBase64 ? this.encodeBase64(sourceCode) : sourceCode,
        language_id: languageId,
        stdin: stdin && this.useBase64 ? this.encodeBase64(stdin) : stdin,
        expected_output: expectedOutput && this.useBase64 ? this.encodeBase64(expectedOutput) : expectedOutput,
        cpu_time_limit: limits?.cpuTimeLimit || config.limits.defaultCpuTimeLimit,
        memory_limit: limits?.memoryLimit || config.limits.defaultMemoryLimitKB,
        wall_time_limit: limits?.wallTimeLimit || config.limits.defaultWallTimeLimit
      };

      logger.debug('[Judge0] Payload de submissão preparado', {
        language_id: submission.language_id,
        cpu_time_limit: submission.cpu_time_limit,
        memory_limit: submission.memory_limit,
        wall_time_limit: submission.wall_time_limit,
        base64_encoded: this.useBase64
      });

      const response = await this.client.post<Judge0SubmissionResponse>(
        '/submissions',
        submission,
        { params: { base64_encoded: this.useBase64.toString(), wait: 'false' } }
      );

      logger.info('[Judge0] Submissão criada com sucesso', {
        token: response.data.token,
        language,
        codeLength: sourceCode.length
      });

      return response.data.token;
    } catch (error) {
      logger.error('[Judge0] Erro ao criar submissão', {
        language,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });

      if (axios.isAxiosError(error)) {
        logger.error('[Judge0] Erro Axios na submissão', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(`Falha ao criar submissão no Judge0: ${errorMsg}`);
      }
      throw new Error('Falha ao criar submissão no Judge0');
    }
  }

  async createBatchSubmissions(
    submissions: Array<{
      sourceCode: string;
      language: ProgrammingLanguage;
      stdin?: string;
      expectedOutput?: string;
    }>,
    limits?: {
      cpuTimeLimit?: number;
      memoryLimit?: number;
      wallTimeLimit?: number;
    }
  ): Promise<string[]> {
    try {
      logger.info('[Judge0] Criando submissões em batch', {
        batchSize: submissions.length,
        language: submissions[0]?.language,
        limits
      });

      const languageId = JUDGE0_LANGUAGE_IDS[submissions[0].language];
      
      if (!languageId) {
        logger.error('[Judge0] Linguagem não suportada no batch', {
          language: submissions[0].language
        });
        throw new Error(`Linguagem ${submissions[0].language} não suportada pelo Judge0`);
      }

      logger.debug('[Judge0] Linguagem mapeada para batch', {
        language: submissions[0].language,
        languageId,
        batchSize: submissions.length
      });

      const batchRequest: Judge0BatchSubmissionRequest = {
        submissions: submissions.map((sub, index) => {
          logger.debug('[Judge0] Preparando submissão do batch', {
            index,
            codeLength: sub.sourceCode.length,
            hasStdin: !!sub.stdin,
            hasExpectedOutput: !!sub.expectedOutput
          });

          return {
            source_code: this.useBase64 ? this.encodeBase64(sub.sourceCode) : sub.sourceCode,
            language_id: languageId,
            stdin: sub.stdin && this.useBase64 ? this.encodeBase64(sub.stdin) : sub.stdin,
            expected_output: sub.expectedOutput && this.useBase64 ? this.encodeBase64(sub.expectedOutput) : sub.expectedOutput,
            cpu_time_limit: limits?.cpuTimeLimit || config.limits.defaultCpuTimeLimit,
            memory_limit: limits?.memoryLimit || config.limits.defaultMemoryLimitKB,
            wall_time_limit: limits?.wallTimeLimit || config.limits.defaultWallTimeLimit
          };
        })
      };

      logger.debug('[Judge0] Payload de batch preparado', {
        batchSize: batchRequest.submissions.length,
        base64_encoded: this.useBase64,
        cpu_time_limit: batchRequest.submissions[0]?.cpu_time_limit,
        memory_limit: batchRequest.submissions[0]?.memory_limit,
        wall_time_limit: batchRequest.submissions[0]?.wall_time_limit
      });

      const response = await this.client.post<Judge0SubmissionResponse[]>(
        '/submissions/batch',
        batchRequest,
        { params: { base64_encoded: this.useBase64.toString() } }
      );

      const tokens = response.data.map(s => s.token);
      
      logger.info('[Judge0] Submissões em batch criadas com sucesso', {
        batchSize: tokens.length,
        tokens: tokens.slice(0, 5) + (tokens.length > 5 ? ` ... +${tokens.length - 5} mais` : '')
      });

      return tokens;
    } catch (error) {
      logger.error('[Judge0] Erro ao criar submissões em batch', {
        batchSize: submissions.length,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });

      if (axios.isAxiosError(error)) {
        logger.error('[Judge0] Erro Axios no batch', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(`Falha ao criar submissões em batch: ${errorMsg}`);
      }
      throw new Error('Falha ao criar submissões em batch no Judge0');
    }
  }

  async getSubmissionStatus(token: string): Promise<Judge0StatusResponse> {
    try {
      logger.debug('[Judge0] Consultando status da submissão', { token });

      const response = await this.client.get<Judge0StatusResponse>(
        `/submissions/${token}`,
        { params: { base64_encoded: this.useBase64.toString(), fields: '*' } }
      );

      logger.debug('[Judge0] Status recebido', {
        token,
        statusId: response.data.status.id,
        statusDescription: response.data.status.description,
        hasStdout: !!response.data.stdout,
        hasStderr: !!response.data.stderr,
        hasCompileOutput: !!response.data.compile_output,
        time: response.data.time,
        memory: response.data.memory
      });

      if (this.useBase64 && response.data) {
        if (response.data.stdout) {
          response.data.stdout = this.decodeBase64(response.data.stdout);
        }
        if (response.data.stderr) {
          response.data.stderr = this.decodeBase64(response.data.stderr);
        }
        if (response.data.compile_output) {
          response.data.compile_output = this.decodeBase64(response.data.compile_output);
        }
        if (response.data.message) {
          response.data.message = this.decodeBase64(response.data.message);
        }

        logger.debug('[Judge0] Base64 decodificado', {
          token,
          stdoutLength: response.data.stdout?.length || 0,
          stderrLength: response.data.stderr?.length || 0
        });
      }

      return response.data;
    } catch (error) {
      logger.error('[Judge0] Erro ao consultar status da submissão', {
        token,
        error: error instanceof Error ? error.message : String(error)
      });

      if (axios.isAxiosError(error)) {
        logger.error('[Judge0] Erro Axios ao consultar status', {
          token,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(`Falha ao consultar status: ${errorMsg}`);
      }
      throw new Error('Falha ao consultar status da submissão');
    }
  }

  async getBatchSubmissionStatus(tokens: string[]): Promise<Judge0StatusResponse[]> {
    try {
      logger.debug('[Judge0] Consultando status em batch', {
        batchSize: tokens.length,
        tokens: tokens.slice(0, 3) + (tokens.length > 3 ? ` ... +${tokens.length - 3} mais` : '')
      });

      const tokensParam = tokens.join(',');
      const response = await this.client.get<Judge0BatchStatusResponse>(
        `/submissions/batch`,
        { params: { tokens: tokensParam, base64_encoded: this.useBase64.toString(), fields: '*' } }
      );

      logger.debug('[Judge0] Status em batch recebido', {
        batchSize: response.data.submissions.length,
        completedCount: response.data.submissions.filter(s => s.status.id > 2).length,
        pendingCount: response.data.submissions.filter(s => s.status.id <= 2).length
      });

      if (this.useBase64 && response.data.submissions) {
        response.data.submissions.forEach((submission) => {
          if (submission.stdout) {
            submission.stdout = this.decodeBase64(submission.stdout);
          }
          if (submission.stderr) {
            submission.stderr = this.decodeBase64(submission.stderr);
          }
          if (submission.compile_output) {
            submission.compile_output = this.decodeBase64(submission.compile_output);
          }
          if (submission.message) {
            submission.message = this.decodeBase64(submission.message);
          }
        });

        logger.debug('[Judge0] Base64 decodificado para batch', {
          batchSize: response.data.submissions.length
        });
      }

      return response.data.submissions;
    } catch (error) {
      logger.error('[Judge0] Erro ao consultar status em batch', {
        batchSize: tokens.length,
        error: error instanceof Error ? error.message : String(error)
      });

      if (axios.isAxiosError(error)) {
        logger.error('[Judge0] Erro Axios ao consultar status em batch', {
          batchSize: tokens.length,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(`Falha ao consultar status em batch: ${errorMsg}`);
      }
      throw new Error('Falha ao consultar status em batch');
    }
  }

  async waitForSubmission(
    token: string,
    maxAttempts: number = 30,
    intervalMs: number = 1000
  ): Promise<Judge0StatusResponse> {
    logger.info('[Judge0] Aguardando conclusão de submissão', {
      token,
      maxAttempts,
      intervalMs
    });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getSubmissionStatus(token);

      logger.debug('[Judge0] Tentativa de verificação de status', {
        token,
        attempt: attempt + 1,
        maxAttempts,
        statusId: status.status.id,
        statusDescription: status.status.description
      });

      if (status.status.id > 2) {
        logger.info('[Judge0] Submissão concluída', {
          token,
          statusId: status.status.id,
          statusDescription: status.status.description,
          attempts: attempt + 1,
          totalTimeMs: (attempt + 1) * intervalMs
        });
        return status;
      }

      if (attempt < maxAttempts - 1) {
        await this.sleep(intervalMs);
      }
    }

    logger.error('[Judge0] Timeout ao aguardar conclusão de submissão', {
      token,
      maxAttempts,
      totalWaitTimeMs: maxAttempts * intervalMs
    });

    throw new Error(`Timeout aguardando conclusão da submissão ${token}`);
  }

  async waitForBatchSubmissions(
    tokens: string[],
    maxAttempts: number = 30,
    intervalMs: number = 1000
  ): Promise<Judge0StatusResponse[]> {
    logger.info('[Judge0] Aguardando conclusão de submissões em batch', {
      batchSize: tokens.length,
      maxAttempts,
      intervalMs,
      tokens: tokens.slice(0, 3) + (tokens.length > 3 ? ` ... +${tokens.length - 3} mais` : '')
    });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statuses = await this.getBatchSubmissionStatus(tokens);

      const completed = statuses.filter(s => s.status.id > 2).length;
      const pending = statuses.filter(s => s.status.id <= 2).length;

      logger.debug('[Judge0] Verificação de status do batch', {
        attempt: attempt + 1,
        maxAttempts,
        completed,
        pending,
        batchSize: tokens.length
      });

      const allCompleted = statuses.every(s => s.status.id > 2);
      if (allCompleted) {
        logger.info('[Judge0] Todas as submissões do batch concluídas', {
          batchSize: tokens.length,
          attempts: attempt + 1,
          totalTimeMs: (attempt + 1) * intervalMs
        });
        return statuses;
      }

      if (attempt < maxAttempts - 1) {
        logger.debug('[Judge0] Aguardando próxima verificação', {
          waitTimeMs: intervalMs,
          nextAttempt: attempt + 2,
          maxAttempts
        });
        await this.sleep(intervalMs);
      }
    }

    logger.error('[Judge0] Timeout ao aguardar conclusão de batch', {
      batchSize: tokens.length,
      maxAttempts,
      totalWaitTimeMs: maxAttempts * intervalMs
    });

    throw new Error(`Timeout aguardando conclusão de ${tokens.length} submissões`);
  }


  async waitForBatchSubmissionsWithCallback(
    tokens: string[],
    onProgress: (progress: {
      completed: number;
      pending: number;
      total: number;
      percentage: number;
      statuses: Judge0StatusResponse[];
    }) => Promise<void>,
    maxAttempts: number = 30,
    intervalMs: number = 1000
  ): Promise<Judge0StatusResponse[]> {
    logger.info('[Judge0] Aguardando conclusão de batch com callbacks', {
      batchSize: tokens.length,
      maxAttempts,
      intervalMs
    });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statuses = await this.getBatchSubmissionStatus(tokens);

      const completed = statuses.filter(s => s.status.id > 2).length;
      const pending = statuses.filter(s => s.status.id <= 2).length;
      const percentage = Math.round((completed / tokens.length) * 100);

      logger.debug('[Judge0] Progresso do batch', {
        attempt: attempt + 1,
        completed,
        pending,
        percentage
      });

      await onProgress({
        completed,
        pending,
        total: tokens.length,
        percentage,
        statuses
      });

      const allCompleted = statuses.every(s => s.status.id > 2);
      if (allCompleted) {
        logger.info('[Judge0] Batch concluído com callbacks', {
          batchSize: tokens.length,
          attempts: attempt + 1
        });
        return statuses;
      }

      if (attempt < maxAttempts - 1) {
        await this.sleep(intervalMs);
      }
    }

    logger.error('[Judge0] Timeout no batch com callbacks', {
      batchSize: tokens.length,
      maxAttempts
    });

    throw new Error(`Timeout aguardando conclusão de ${tokens.length} submissões`);
  }

  processSubmissionResult(
    status: Judge0StatusResponse,
    expectedOutput?: string
  ): ProcessedSubmissionResult {
    logger.debug('[Judge0] Processing submission result', {
      token: status.token,
      statusId: status.status.id,
      statusDescription: status.status.description,
      hasExpectedOutput: !!expectedOutput,
      time: status.time,
      memory: status.memory,
      hasStdout: !!status.stdout,
      hasStderr: !!status.stderr,
      hasCompileOutput: !!status.compile_output
    });

    const result: ProcessedSubmissionResult = {
      verdict: this.mapStatusToVerdict(status.status.id),
      passed: false,
      executionTimeMs: status.time ? parseFloat(status.time) * 1000 : undefined,
      memoryUsedKb: status.memory || undefined,
      output: status.stdout?.trim(),
      errorMessage: status.stderr || status.compile_output || status.message
    };

    if (status.status.id === 3) {
      
      if (expectedOutput) {
        const actualOutput = (status.stdout || '').trim();
        const expectedTrimmed = expectedOutput.trim();
        result.passed = actualOutput === expectedTrimmed;

        if (!result.passed) {
          result.verdict = JudgeVerdict.WRONG_ANSWER;
          logger.debug('[Judge0] Incorrect output detected', {
            token: status.token,
            expectedLength: expectedTrimmed.length,
            actualLength: actualOutput.length
          });
        } else {
          logger.debug('[Judge0] Saída correta confirmada', {
            token: status.token,
            outputLength: actualOutput.length
          });
        }
      } else {
        
        result.passed = true;
        logger.debug('[Judge0] Sem output esperado, considerando como aceito', {
          token: status.token
        });
      }
    }

    logger.info('[Judge0] Resultado processado', {
      token: status.token,
      verdict: result.verdict,
      passed: result.passed,
      executionTimeMs: result.executionTimeMs,
      memoryUsedKb: result.memoryUsedKb
    });

    return result;
  }

  private mapStatusToVerdict(statusId: number): JudgeVerdict {
    logger.debug('[Judge0] Mapping status to verdict', { statusId });

    const verdict = (() => {
      switch (statusId) {
        case 3: 
          return JudgeVerdict.ACCEPTED;
        case 4: 
          return JudgeVerdict.WRONG_ANSWER;
        case 5: 
          return JudgeVerdict.TIME_LIMIT_EXCEEDED;
        case 6: 
          return JudgeVerdict.COMPILATION_ERROR;
        case 7: 
        case 8: 
        case 9: 
        case 10: 
        case 11: 
        case 12: 
          return JudgeVerdict.RUNTIME_ERROR;
        case 13: 
          return JudgeVerdict.INTERNAL_ERROR;
        case 14: 
          return JudgeVerdict.JUDGE_ERROR;
        default:
          return JudgeVerdict.JUDGE_ERROR;
      }
    })();

    logger.debug('[Judge0] Verdict mapped', { statusId, verdict });
    return verdict;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

