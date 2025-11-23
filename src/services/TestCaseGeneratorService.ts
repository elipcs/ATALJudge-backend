/**
 * @module services/TestCaseGeneratorService
 * @description Main service for generating test cases automatically
 * Orchestrates constraint parsing, input generation, and oracle execution
 * @class TestCaseGeneratorService
 */
import { injectable, inject } from 'tsyringe';
import { OracleExecutionService } from './OracleExecutionService';
import { TestInputGenerator } from './TestInputGenerator';
import { AlgorithmType } from '../dtos/TestCaseGeneratorDtos';
import { ConstraintParser } from '../utils/ConstraintParser';
import { ProgrammingLanguage } from '../enums/ProgrammingLanguage';
import { logger } from '../utils';

export interface GeneratedTestCase {
  input: string;
  expectedOutput: string;
}

export interface GenerationOptions {
  oracleCode: string;
  language: ProgrammingLanguage;
  count: number;
  algorithmType: AlgorithmType;
  constraints: string;
  questionStatement?: string;
  examples?: Array<{ input: string; output?: string }>; // Question examples for format detection
}

@injectable()
export class TestCaseGeneratorService {
  constructor(
    @inject(OracleExecutionService) private oracleService: OracleExecutionService
  ) {}

  /**
   * Generates test cases by:
   * 1. Parsing constraints
   * 2. Analyzing input format from question examples (if provided)
   * 3. Generating inputs based on algorithm type and detected format
   * 4. Executing oracle code for each input
   * 5. Returning test cases with inputs and expected outputs
   * 
   * Note: The system is generic and supports various input formats:
   * - Single-line inputs (n)
   * - Multi-line inputs (n m, then data)
   * - Array inputs (n, then array)
   * - Matrix inputs (n, then n lines)
   * - Graph inputs (n m, then m edges)
   * - String inputs (single string or n strings)
   * - Mixed formats
   * 
   * The format is automatically detected from question examples.
   */
  async generateTestCases(options: GenerationOptions): Promise<GeneratedTestCase[]> {
    logger.info('[TestCaseGenerator] Iniciando geração de casos de teste', {
      count: options.count,
      algorithmType: options.algorithmType,
      language: options.language
    });

    try {
      // 1. Parse constraints
      const parsedConstraints = ConstraintParser.parse(options.constraints);
      logger.debug('[TestCaseGenerator] Constraints parseados', {
        variables: parsedConstraints.variables.length,
        hasNegative: parsedConstraints.hasNegative,
        hasZero: parsedConstraints.hasZero
      });

      // 2. Generate inputs (with examples for format detection)
      const inputs = TestInputGenerator.generate({
        count: options.count,
        algorithmType: options.algorithmType,
        constraints: parsedConstraints,
        questionStatement: options.questionStatement,
        examples: options.examples // Pass examples to detect input format
      });

      logger.info('[TestCaseGenerator] Entradas geradas', {
        count: inputs.length
      });

      // 3. Execute oracle for each input
      const results = await this.oracleService.executeOracleBatch(
        options.oracleCode,
        options.language,
        inputs
      );

      // 4. Build test cases
      const testCases: GeneratedTestCase[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const input = inputs[i];

        if (result.success && result.output !== undefined) {
          testCases.push({
            input,
            expectedOutput: result.output
          });
          successCount++;
        } else {
          failureCount++;
          logger.warn('[TestCaseGenerator] Falha ao gerar caso de teste', {
            index: i + 1,
            error: result.error
          });
        }
      }

      logger.info('[TestCaseGenerator] Geração concluída', {
        total: testCases.length,
        successful: successCount,
        failed: failureCount
      });

      if (testCases.length === 0) {
        throw new Error('Nenhum caso de teste foi gerado com sucesso. Verifique o código oráculo.');
      }

      return testCases;
    } catch (error) {
      logger.error('[TestCaseGenerator] Erro na geração de casos de teste', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Detects algorithm type from question text and tags
   * Falls back to 'default' if cannot be determined
   */
  static detectAlgorithmType(
    text: string,
    tags: string[] = []
  ): AlgorithmType {
    const searchText = (text + ' ' + tags.join(' ')).toLowerCase();

    // Check tags first
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      if (tagLower.includes('backtrack')) return 'backtracking';
      if (tagLower.includes('graph') || tagLower.includes('tree')) return 'graph';
      if (tagLower.includes('divide') || tagLower.includes('conquer')) return 'divide-conquer';
      if (tagLower.includes('brute') || tagLower.includes('force')) return 'brute-force';
      if (tagLower.includes('greedy')) return 'greedy';
      if (tagLower.includes('dp') || tagLower.includes('dynamic')) return 'dynamic-programming';
      if (tagLower.includes('math') || tagLower.includes('number')) return 'math';
      if (tagLower.includes('string')) return 'string';
    }

    // Check text content
    if (searchText.includes('backtrack') || searchText.includes('permutation') || searchText.includes('combination')) {
      return 'backtracking';
    }
    if (searchText.includes('graph') || searchText.includes('node') || searchText.includes('edge') || searchText.includes('tree')) {
      return 'graph';
    }
    if (searchText.includes('divide') || searchText.includes('conquer') || searchText.includes('merge sort') || searchText.includes('quick sort')) {
      return 'divide-conquer';
    }
    if (searchText.includes('brute force') || searchText.includes('try all')) {
      return 'brute-force';
    }
    if (searchText.includes('greedy') || searchText.includes('optimal choice')) {
      return 'greedy';
    }
    if (searchText.includes('dynamic programming') || searchText.includes('dp') || searchText.includes('memoization')) {
      return 'dynamic-programming';
    }
    if (searchText.includes('math') || searchText.includes('number theory') || searchText.includes('gcd') || searchText.includes('prime')) {
      return 'math';
    }
    if (searchText.includes('string') || searchText.includes('substring') || searchText.includes('pattern')) {
      return 'string';
    }

    return 'default';
  }
}







