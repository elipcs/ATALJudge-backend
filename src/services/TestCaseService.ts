import { TestCaseRepository } from '../repositories';
import { CreateTestCaseDTO, UpdateTestCaseDTO, TestCaseResponseDTO } from '../dtos';
import { NotFoundError, InternalServerError } from '../utils';
import { DeepPartial } from 'typeorm';

/**
 * Service para gerenciamento de casos de teste
 */
export class TestCaseService {
  private testCaseRepository: TestCaseRepository;

  constructor(testCaseRepository: TestCaseRepository) {
    this.testCaseRepository = testCaseRepository;
  }

  /**
   * Lista casos de teste de uma questão
   */
  async getTestCasesByQuestion(questionId: string): Promise<TestCaseResponseDTO[]> {
    const testCases = await this.testCaseRepository.findByQuestion(questionId);
    
    return testCases.map(tc => new TestCaseResponseDTO({
      id: tc.id,
      questionId: tc.questionId,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isSample: tc.isSample,
      weight: tc.weight,
      createdAt: tc.createdAt
    }));
  }

  /**
   * Busca caso de teste por ID
   */
  async getTestCaseById(id: string): Promise<TestCaseResponseDTO> {
    const testCase = await this.testCaseRepository.findById(id);
    
    if (!testCase) {
      throw new NotFoundError('Caso de teste não encontrado', 'TESTCASE_NOT_FOUND');
    }
    
    return new TestCaseResponseDTO({
      id: testCase.id,
      questionId: testCase.questionId,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      isSample: testCase.isSample,
      weight: testCase.weight,
      createdAt: testCase.createdAt
    });
  }

  /**
   * Cria um novo caso de teste
   */
  async createTestCase(data: CreateTestCaseDTO): Promise<TestCaseResponseDTO> {
    const testCase = await this.testCaseRepository.create({
      questionId: data.questionId,
      input: data.input,
      expectedOutput: data.expectedOutput,
      isSample: data.isSample ?? false,
      weight: data.weight ?? 1
    });
    
    return new TestCaseResponseDTO({
      id: testCase.id,
      questionId: testCase.questionId,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      isSample: testCase.isSample,
      weight: testCase.weight,
      createdAt: testCase.createdAt
    });
  }

  /**
   * Atualiza um caso de teste
   */
  async updateTestCase(id: string, data: UpdateTestCaseDTO): Promise<TestCaseResponseDTO> {
    const testCase = await this.testCaseRepository.findById(id);
    
    if (!testCase) {
      throw new NotFoundError('Caso de teste não encontrado', 'TESTCASE_NOT_FOUND');
    }
    
    const updateData: DeepPartial<typeof testCase> = {};
    if (data.input !== undefined) updateData.input = data.input;
    if (data.expectedOutput !== undefined) updateData.expectedOutput = data.expectedOutput;
    if (data.isSample !== undefined) updateData.isSample = data.isSample;
    if (data.weight !== undefined) updateData.weight = data.weight;
    
    const updated = await this.testCaseRepository.update(id, updateData);
    
    if (!updated) {
      throw new InternalServerError('Erro ao atualizar caso de teste', 'UPDATE_ERROR');
    }
    
    return new TestCaseResponseDTO({
      id: updated.id,
      questionId: updated.questionId,
      input: updated.input,
      expectedOutput: updated.expectedOutput,
      isSample: updated.isSample,
      weight: updated.weight,
      createdAt: updated.createdAt
    });
  }

  /**
   * Deleta um caso de teste
   */
  async deleteTestCase(id: string): Promise<void> {
    const testCase = await this.testCaseRepository.findById(id);
    
    if (!testCase) {
      throw new NotFoundError('Caso de teste não encontrado', 'TESTCASE_NOT_FOUND');
    }
    
    await this.testCaseRepository.delete(id);
  }

  /**
   * Deleta todos os casos de teste de uma questão
   */
  async deleteTestCasesByQuestion(questionId: string): Promise<void> {
    const testCases = await this.testCaseRepository.findByQuestion(questionId);
    
    for (const testCase of testCases) {
      await this.testCaseRepository.delete(testCase.id);
    }
  }
}


