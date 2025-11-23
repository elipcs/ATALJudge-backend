/**
 * @module services/OracleExecutionService
 * @description Service for executing oracle code (Python/Java) to generate expected outputs
 * Uses Judge0Service to execute the oracle code with generated inputs
 * @class OracleExecutionService
 */
import { injectable, inject } from 'tsyringe';
import { Judge0Service } from './Judge0Service';
import { ProgrammingLanguage } from '../enums/ProgrammingLanguage';
import { JudgeVerdict } from '../enums/JudgeVerdict';
import { logger } from '../utils';

export interface OracleExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTimeMs?: number;
}

@injectable()
export class OracleExecutionService {
  private readonly ORACLE_TIMEOUT_SECONDS = 5;

  constructor(
    @inject(Judge0Service) private judge0Service: Judge0Service
  ) {}

  /**
   * Executes oracle code with given input and returns the output
   * @param oracleCode Source code of the oracle (Python or Java)
   * @param language Programming language of the oracle code
   * @param input Input string to feed to the oracle
   * @returns Promise with execution result containing output or error
   */
  async executeOracle(
    oracleCode: string,
    language: ProgrammingLanguage,
    input: string
  ): Promise<OracleExecutionResult> {
    try {
      logger.info('[OracleExecution] Executando oráculo', {
        language,
        codeLength: oracleCode.length,
        inputLength: input.length
      });

      // Validate language
      if (language !== ProgrammingLanguage.PYTHON && language !== ProgrammingLanguage.JAVA) {
        throw new Error(`Linguagem ${language} não suportada para oráculo. Use Python ou Java.`);
      }

      // Create submission with timeout
      const token = await this.judge0Service.createSubmission(
        oracleCode,
        language,
        input,
        undefined, // No expected output for oracle
        {
          cpuTimeLimit: this.ORACLE_TIMEOUT_SECONDS,
          wallTimeLimit: this.ORACLE_TIMEOUT_SECONDS + 1 // Slightly higher for safety
        }
      );

      // Wait for execution to complete
      const status = await this.judge0Service.waitForSubmission(
        token,
        10, // maxAttempts (should complete within 5 seconds)
        500 // intervalMs
      );

      // Process result
      const processed = this.judge0Service.processSubmissionResult(status);

      if (processed.verdict === JudgeVerdict.ACCEPTED) {
        logger.info('[OracleExecution] Oráculo executado com sucesso', {
          outputLength: processed.output?.length || 0,
          executionTimeMs: processed.executionTimeMs
        });

        return {
          success: true,
          output: processed.output || '',
          executionTimeMs: processed.executionTimeMs
        };
      } else {
        const errorMessage = this.getErrorMessage(processed);
        logger.error('[OracleExecution] Erro na execução do oráculo', {
          verdict: processed.verdict,
          errorMessage
        });

        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      logger.error('[OracleExecution] Exceção ao executar oráculo', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao executar oráculo'
      };
    }
  }

  /**
   * Executes oracle code for multiple inputs in batch
   * @param oracleCode Source code of the oracle
   * @param language Programming language
   * @param inputs Array of input strings
   * @returns Promise with array of execution results
   */
  async executeOracleBatch(
    oracleCode: string,
    language: ProgrammingLanguage,
    inputs: string[]
  ): Promise<OracleExecutionResult[]> {
    logger.info('[OracleExecution] Executando oráculo em batch', {
      language,
      batchSize: inputs.length
    });

    const results: OracleExecutionResult[] = [];

    // Execute sequentially to avoid overwhelming Judge0
    for (let i = 0; i < inputs.length; i++) {
      logger.debug('[OracleExecution] Executando entrada do batch', {
        index: i + 1,
        total: inputs.length
      });

      const result = await this.executeOracle(oracleCode, language, inputs[i]);
      results.push(result);

      // If oracle fails, stop processing
      if (!result.success) {
        logger.warn('[OracleExecution] Oráculo falhou, interrompendo batch', {
          index: i + 1,
          error: result.error
        });
        // Fill remaining with error results
        for (let j = i + 1; j < inputs.length; j++) {
          results.push({
            success: false,
            error: `Oráculo falhou na entrada ${i + 1}, batch interrompido`
          });
        }
        break;
      }

      // Small delay to avoid rate limiting
      if (i < inputs.length - 1) {
        await this.sleep(100);
      }
    }

    logger.info('[OracleExecution] Batch concluído', {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * Extracts error message from processed submission result
   */
  private getErrorMessage(processed: {
    verdict: JudgeVerdict;
    errorMessage?: string;
  }): string {
    if (processed.errorMessage) {
      return processed.errorMessage;
    }

    switch (processed.verdict) {
      case JudgeVerdict.COMPILATION_ERROR:
        return 'Erro de compilação no código oráculo';
      case JudgeVerdict.RUNTIME_ERROR:
        return 'Erro de execução no código oráculo';
      case JudgeVerdict.TIME_LIMIT_EXCEEDED:
        return 'Tempo limite excedido na execução do oráculo';
      case JudgeVerdict.MEMORY_LIMIT_EXCEEDED:
        return 'Limite de memória excedido na execução do oráculo';
      default:
        return `Erro na execução do oráculo: ${processed.verdict}`;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}













