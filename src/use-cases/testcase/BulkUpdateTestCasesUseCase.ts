import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { BulkUpdateTestCasesDTO, TestCaseResponseDTO } from '../../dtos/TestCaseDtos';
import { TestCaseRepository, QuestionRepository } from '../../repositories';
import { TestCase } from '../../models/TestCase';
import { logger, NotFoundError } from '../../utils';

export interface BulkUpdateTestCasesUseCaseInput {
  questionId: string;
  dto: BulkUpdateTestCasesDTO;
}

/**
 * Use Case: Bulk update test cases for a question
 * 
 * Responsibilities:
 * - Find question
 * - Process all test cases in a single transaction
 * - Create new test cases (without ID)
 * - Update existing test cases (with ID)
 * - Delete test cases not in the list
 * - Return all updated test cases
 */
@injectable()
export class BulkUpdateTestCasesUseCase implements IUseCase<BulkUpdateTestCasesUseCaseInput, TestCaseResponseDTO[]> {
  constructor(
    @inject(TestCaseRepository) private testCaseRepository: TestCaseRepository,
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) {}

  async execute(input: BulkUpdateTestCasesUseCaseInput): Promise<TestCaseResponseDTO[]> {
    const { questionId, dto } = input;

    // 1. Verificar se questão existe
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    // 2. Buscar casos de teste existentes
    const existingTestCases = await this.testCaseRepository.findByQuestion(questionId);
    const existingIds = new Set(existingTestCases.map(tc => tc.id));
    
    // 3. Separar novos e existentes
    const testCasesToCreate: TestCase[] = [];
    const testCasesToUpdate: TestCase[] = [];
    const submittedIds = new Set<string>();

    for (const tcDto of dto.testCases) {
      if (tcDto.id && existingIds.has(tcDto.id)) {
        // Atualizar existente
        const existing = existingTestCases.find(tc => tc.id === tcDto.id);
        if (existing) {
          existing.input = tcDto.input;
          existing.expectedOutput = tcDto.expectedOutput;
          existing.weight = tcDto.weight;
          testCasesToUpdate.push(existing);
          submittedIds.add(tcDto.id);
        }
      } else {
        // Criar novo
        const newTestCase = new TestCase();
        newTestCase.questionId = questionId;
        newTestCase.input = tcDto.input;
        newTestCase.expectedOutput = tcDto.expectedOutput;
        newTestCase.weight = tcDto.weight;
        testCasesToCreate.push(newTestCase);
      }
    }

    // 4. Identificar casos para deletar (não foram enviados)
    const testCasesToDelete = existingTestCases.filter(tc => !submittedIds.has(tc.id));

    logger.info('[BulkUpdateTestCases] Processing', {
      questionId,
      toCreate: testCasesToCreate.length,
      toUpdate: testCasesToUpdate.length,
      toDelete: testCasesToDelete.length
    });

    // 5. Executar operações
    const results: TestCase[] = [];

    // Criar novos
    for (const tc of testCasesToCreate) {
      const created = await this.testCaseRepository.create(tc);
      results.push(created);
    }

    // Atualizar existentes
    for (const tc of testCasesToUpdate) {
      await this.testCaseRepository.update(tc.id, {
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        weight: tc.weight
      });
      results.push(tc);
    }

    // Deletar não enviados
    for (const tc of testCasesToDelete) {
      await this.testCaseRepository.delete(tc.id);
    }

    logger.info('[BulkUpdateTestCases] Completed', {
      questionId,
      totalResults: results.length
    });

    // 6. Retornar todos os casos atualizados
    return results.map(tc => new TestCaseResponseDTO({
      id: tc.id,
      questionId: tc.questionId,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      weight: tc.weight,
      createdAt: tc.createdAt
    }));
  }
}

