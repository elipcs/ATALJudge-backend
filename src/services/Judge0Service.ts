import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { JUDGE0_LANGUAGE_IDS, ProgrammingLanguage } from '../enums/ProgrammingLanguage';
import { JudgeVerdict } from '../enums/JudgeVerdict';
import { logger } from '../utils';

/**
 * Interfaces para tipos do Judge0
 */
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

/**
 * Resultado processado de uma submissão Judge0
 */
export interface ProcessedSubmissionResult {
  verdict: JudgeVerdict;
  passed: boolean;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  output?: string;
  errorMessage?: string;
}

/**
 * Serviço para comunicação com a API do Judge0
 */
export class Judge0Service {
  private client: AxiosInstance;
  private useBase64: boolean;

  constructor() {
    // Determina se deve usar base64 (recomendado para caracteres especiais)
    this.useBase64 = true;

    // Configurar headers baseado no tipo de instância Judge0
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Se estiver usando RapidAPI
    if (config.judge0.rapidApiKey) {
      headers['X-RapidAPI-Key'] = config.judge0.rapidApiKey;
      headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
      logger.info('[Judge0] Usando Judge0 via RapidAPI');
    } 
    // Se estiver usando instância local com API key
    else if (config.judge0.apiKey) {
      headers['X-Auth-Token'] = config.judge0.apiKey;
      logger.info('[Judge0] Usando Judge0 local com autenticação');
    }
    // Instância local sem autenticação
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

  /**
   * Codifica string em base64
   */
  private encodeBase64(str: string): string {
    return Buffer.from(str, 'utf-8').toString('base64');
  }

  /**
   * Decodifica string de base64
   */
  private decodeBase64(str: string): string {
    return Buffer.from(str, 'base64').toString('utf-8');
  }

  /**
   * Cria uma submissão única no Judge0
   */
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
      const languageId = JUDGE0_LANGUAGE_IDS[language];
      
      if (!languageId) {
        throw new Error(`Linguagem ${language} não suportada pelo Judge0`);
      }

      const submission: Judge0SubmissionRequest = {
        source_code: this.useBase64 ? this.encodeBase64(sourceCode) : sourceCode,
        language_id: languageId,
        stdin: stdin && this.useBase64 ? this.encodeBase64(stdin) : stdin,
        expected_output: expectedOutput && this.useBase64 ? this.encodeBase64(expectedOutput) : expectedOutput,
        cpu_time_limit: limits?.cpuTimeLimit || config.limits.defaultCpuTimeLimit,
        memory_limit: limits?.memoryLimit || config.limits.defaultMemoryLimitKB,
        wall_time_limit: limits?.wallTimeLimit || config.limits.defaultWallTimeLimit
      };

      const response = await this.client.post<Judge0SubmissionResponse>(
        '/submissions',
        submission,
        { params: { base64_encoded: this.useBase64.toString(), wait: 'false' } }
      );

      logger.info('[Judge0] Submissão criada', { token: response.data.token, language });
      return response.data.token;
    } catch (error) {
      logger.error('[Judge0] Erro ao criar submissão', { error });
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(`Falha ao criar submissão no Judge0: ${errorMsg}`);
      }
      throw new Error('Falha ao criar submissão no Judge0');
    }
  }

  /**
   * Cria múltiplas submissões em batch no Judge0
   */
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
      const languageId = JUDGE0_LANGUAGE_IDS[submissions[0].language];
      
      if (!languageId) {
        throw new Error(`Linguagem ${submissions[0].language} não suportada pelo Judge0`);
      }

      const batchRequest: Judge0BatchSubmissionRequest = {
        submissions: submissions.map(sub => ({
          source_code: this.useBase64 ? this.encodeBase64(sub.sourceCode) : sub.sourceCode,
          language_id: languageId,
          stdin: sub.stdin && this.useBase64 ? this.encodeBase64(sub.stdin) : sub.stdin,
          expected_output: sub.expectedOutput && this.useBase64 ? this.encodeBase64(sub.expectedOutput) : sub.expectedOutput,
          cpu_time_limit: limits?.cpuTimeLimit || config.limits.defaultCpuTimeLimit,
          memory_limit: limits?.memoryLimit || config.limits.defaultMemoryLimitKB,
          wall_time_limit: limits?.wallTimeLimit || config.limits.defaultWallTimeLimit
        }))
      };

      const response = await this.client.post<Judge0SubmissionResponse[]>(
        '/submissions/batch',
        batchRequest,
        { params: { base64_encoded: this.useBase64.toString() } }
      );

      const tokens = response.data.map(s => s.token);
      logger.info('[Judge0] Submissões em batch criadas', { count: tokens.length });
      return tokens;
    } catch (error) {
      logger.error('[Judge0] Erro ao criar submissões em batch', { error });
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(`Falha ao criar submissões em batch: ${errorMsg}`);
      }
      throw new Error('Falha ao criar submissões em batch no Judge0');
    }
  }

  /**
   * Consulta o status de uma submissão
   */
  async getSubmissionStatus(token: string): Promise<Judge0StatusResponse> {
    try {
      const response = await this.client.get<Judge0StatusResponse>(
        `/submissions/${token}`,
        { params: { base64_encoded: this.useBase64.toString(), fields: '*' } }
      );

      // Decodificar campos base64 se necessário
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
      }

      return response.data;
    } catch (error) {
      logger.error('[Judge0] Erro ao consultar status da submissão', { token, error });
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(`Falha ao consultar status: ${errorMsg}`);
      }
      throw new Error('Falha ao consultar status da submissão');
    }
  }

  /**
   * Consulta o status de múltiplas submissões em batch
   */
  async getBatchSubmissionStatus(tokens: string[]): Promise<Judge0StatusResponse[]> {
    try {
      const tokensParam = tokens.join(',');
      const response = await this.client.get<Judge0BatchStatusResponse>(
        `/submissions/batch`,
        { params: { tokens: tokensParam, base64_encoded: this.useBase64.toString(), fields: '*' } }
      );

      // Decodificar campos base64 se necessário
      if (this.useBase64 && response.data.submissions) {
        response.data.submissions.forEach(submission => {
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
      }

      return response.data.submissions;
    } catch (error) {
      logger.error('[Judge0] Erro ao consultar status em batch', { count: tokens.length, error });
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(`Falha ao consultar status em batch: ${errorMsg}`);
      }
      throw new Error('Falha ao consultar status em batch');
    }
  }

  /**
   * Aguarda a conclusão de uma submissão com polling
   */
  async waitForSubmission(
    token: string,
    maxAttempts: number = 30,
    intervalMs: number = 1000
  ): Promise<Judge0StatusResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getSubmissionStatus(token);

      // Status IDs: 1=In Queue, 2=Processing
      // Status IDs >= 3 indicam conclusão (aceito, erro, etc)
      if (status.status.id > 2) {
        return status;
      }

      await this.sleep(intervalMs);
    }

    throw new Error(`Timeout aguardando conclusão da submissão ${token}`);
  }

  /**
   * Aguarda a conclusão de múltiplas submissões com polling
   */
  async waitForBatchSubmissions(
    tokens: string[],
    maxAttempts: number = 30,
    intervalMs: number = 1000
  ): Promise<Judge0StatusResponse[]> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statuses = await this.getBatchSubmissionStatus(tokens);

      // Verifica se todas as submissões foram concluídas
      const allCompleted = statuses.every(s => s.status.id > 2);
      if (allCompleted) {
        return statuses;
      }

      await this.sleep(intervalMs);
    }

    throw new Error(`Timeout aguardando conclusão de ${tokens.length} submissões`);
  }

  /**
   * Processa o resultado de uma submissão do Judge0
   */
  processSubmissionResult(
    status: Judge0StatusResponse,
    expectedOutput?: string
  ): ProcessedSubmissionResult {
    const result: ProcessedSubmissionResult = {
      verdict: this.mapStatusToVerdict(status.status.id),
      passed: false,
      executionTimeMs: status.time ? parseFloat(status.time) * 1000 : undefined,
      memoryUsedKb: status.memory || undefined,
      output: status.stdout?.trim(),
      errorMessage: status.stderr || status.compile_output || status.message
    };

    // Status 3 = Accepted
    if (status.status.id === 3) {
      // Se esperávamos um output específico, comparar
      if (expectedOutput) {
        const actualOutput = (status.stdout || '').trim();
        const expectedTrimmed = expectedOutput.trim();
        result.passed = actualOutput === expectedTrimmed;
        
        // Se não passou, é Wrong Answer
        if (!result.passed) {
          result.verdict = JudgeVerdict.WRONG_ANSWER;
        }
      } else {
        // Sem output esperado, considera aceito se rodou sem erros
        result.passed = true;
      }
    }

    return result;
  }

  /**
   * Mapeia ID de status do Judge0 para JudgeVerdict
   */
  private mapStatusToVerdict(statusId: number): JudgeVerdict {
    // Referência: https://github.com/judge0/judge0/blob/master/docs/api.md#statuses-and-languages
    switch (statusId) {
      case 3: // Accepted
        return JudgeVerdict.ACCEPTED;
      case 4: // Wrong Answer
        return JudgeVerdict.WRONG_ANSWER;
      case 5: // Time Limit Exceeded
        return JudgeVerdict.TIME_LIMIT_EXCEEDED;
      case 6: // Compilation Error
        return JudgeVerdict.COMPILATION_ERROR;
      case 7: // Runtime Error (SIGSEGV)
      case 8: // Runtime Error (SIGXFSZ)
      case 9: // Runtime Error (SIGFPE)
      case 10: // Runtime Error (SIGABRT)
      case 11: // Runtime Error (NZEC)
      case 12: // Runtime Error (Other)
        return JudgeVerdict.RUNTIME_ERROR;
      case 13: // Internal Error
        return JudgeVerdict.INTERNAL_ERROR;
      case 14: // Exec Format Error
        return JudgeVerdict.JUDGE_ERROR;
      default:
        return JudgeVerdict.JUDGE_ERROR;
    }
  }

  /**
   * Helper para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

