/**
 * @module use-cases/testcase/GenerateTestCasesUseCase
 * @description Use case for generating test cases automatically using the microservice
 */
import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { TestCaseGeneratorMicroservice } from '../../services/TestCaseGeneratorMicroservice';
import { QuestionRepository } from '../../repositories';
import { CreateTestCaseUseCase } from './CreateTestCaseUseCase';
import { GenerateTestCasesDTO, GenerateTestCasesResponseDTO, GeneratedTestCaseDTO } from '../../dtos/TestCaseGeneratorDtos';
import { ProgrammingLanguage } from '../../enums/ProgrammingLanguage';
import { NotFoundError, ValidationError, ConflictError } from '../../utils';
import { logger } from '../../utils';

export interface GenerateTestCasesUseCaseInput {
  questionId: string;
  dto: GenerateTestCasesDTO;
  jwtToken: string; // JWT token for authentication with microservice
}

@injectable()
export class GenerateTestCasesUseCase implements IUseCase<GenerateTestCasesUseCaseInput, GenerateTestCasesResponseDTO> {
  constructor(
    @inject(TestCaseGeneratorMicroservice) private testCaseGeneratorMicroservice: TestCaseGeneratorMicroservice,
    @inject(QuestionRepository) private questionRepository: QuestionRepository,
    @inject(CreateTestCaseUseCase) private createTestCaseUseCase: CreateTestCaseUseCase
  ) {}

  async execute(input: GenerateTestCasesUseCaseInput): Promise<GenerateTestCasesResponseDTO> {
    const { questionId, dto, jwtToken } = input;

    logger.info('[GenerateTestCasesUseCase] Iniciando geração de casos de teste via microservice', {
      questionId,
      count: dto.count,
      language: dto.language
    });

    // 1. Get question
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    // 2. Validate question is local type
    if (question.submissionType !== 'local') {
      throw new ValidationError('Test case generation is only available for local questions', 'INVALID_QUESTION_TYPE');
    }

    // 3. Validate oracle code is Python (microservice currently only supports Python)
    if (dto.language !== ProgrammingLanguage.PYTHON) {
      throw new ValidationError('Test case generation via microservice currently only supports Python', 'UNSUPPORTED_LANGUAGE');
    }

    // 4. Call microservice to generate test cases
    logger.info('[GenerateTestCasesUseCase] Chamando microservice', {
      questionId,
      count: dto.count,
      useGemini: true // Always use Gemini if available
    });

    const microserviceResponse = await this.testCaseGeneratorMicroservice.generateTestCases(
      {
        question_id: questionId,
        oracle_code: dto.oracleCode,
        count: dto.count,
        use_gemini: true,
        use_supervision: dto.use_supervision !== undefined ? dto.use_supervision : false
      },
      jwtToken
    );

    logger.info('[GenerateTestCasesUseCase] Casos de teste recebidos do microservice', {
      questionId,
      totalGenerated: microserviceResponse.total_generated,
      algorithmType: microserviceResponse.algorithm_type
    });

    // 5. Transform and save test cases to database
    const savedTestCases: GeneratedTestCaseDTO[] = [];
    const savedTestCaseIds: string[] = [];
    let savedCount = 0;
    let skippedCount = 0;

    for (const testCase of microserviceResponse.test_cases) {
      try {
        // Save each test case to database
        const savedTestCase = await this.createTestCaseUseCase.execute({
          questionId: questionId,
          input: testCase.input,
          expectedOutput: testCase.output,
          weight: 1 // Default weight
        });

        savedTestCases.push({
          input: savedTestCase.input,
          expectedOutput: savedTestCase.expectedOutput
        });
        savedTestCaseIds.push(savedTestCase.id);
        savedCount++;
      } catch (error) {
        // If test case already exists (duplicate), skip it
        if (error instanceof ConflictError && error.errorCode === 'TESTCASE_DUPLICATE') {
          logger.warn('[GenerateTestCasesUseCase] Caso de teste duplicado, pulando', {
            questionId,
            input: testCase.input.substring(0, 50)
          });
          skippedCount++;
        } else {
          logger.error('[GenerateTestCasesUseCase] Erro ao salvar caso de teste', {
            questionId,
            error: error instanceof Error ? error.message : String(error),
            errorCode: error instanceof ConflictError ? error.errorCode : undefined
          });
          // Continue with other test cases even if one fails
          skippedCount++;
        }
      }
    }

    logger.info('[GenerateTestCasesUseCase] Casos de teste salvos com sucesso', {
      questionId,
      totalGenerated: microserviceResponse.total_generated,
      saved: savedCount,
      skipped: skippedCount,
      algorithmType: microserviceResponse.algorithm_type
    });

    return {
      testCases: savedTestCases,
      totalGenerated: savedCount,
      algorithmTypeDetected: microserviceResponse.algorithm_type
    };
  }
}

