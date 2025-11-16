/**
 * @module services/TestCaseService
 * @description Service for managing test cases for questions.
 * 
 * This service handles:
 * - Retrieving test cases (by question, by ID)
 * - Creating new test cases
 * - Updating test cases
 * - Deleting test cases (individually or by question)
 * 
 * @example
 * const testCaseService = container.resolve(TestCaseService);
 * const testCases = await testCaseService.getTestCasesByQuestion(questionId);
 * const created = await testCaseService.createTestCase({ questionId, input, expectedOutput });
 */

import { injectable, inject } from 'tsyringe';
import { TestCaseRepository } from '../repositories';
import { CreateTestCaseDTO, UpdateTestCaseDTO, TestCaseResponseDTO } from '../dtos';
import { NotFoundError, InternalServerError } from '../utils';
import { DeepPartial } from 'typeorm';

/**
 * Service for managing test cases.
 * 
 * @class TestCaseService
 */
@injectable()
export class TestCaseService {
  constructor(
    @inject(TestCaseRepository) private testCaseRepository: TestCaseRepository
  ) {}

  /**
   * Retrieves all test cases for a question.
   * 
   * @async
   * @param {string} questionId - The question ID
   * @returns {Promise<TestCaseResponseDTO[]>} Array of test cases
   */
  async getTestCasesByQuestion(questionId: string): Promise<TestCaseResponseDTO[]> {
    const testCases = await this.testCaseRepository.findByQuestion(questionId);
    
    return testCases.map(tc => new TestCaseResponseDTO({
      id: tc.id,
      questionId: tc.questionId,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      weight: tc.weight,
      createdAt: tc.createdAt
    }));
  }

  /**
   * Retrieves a test case by ID.
   * 
   * @async
   * @param {string} id - The test case ID
   * @returns {Promise<TestCaseResponseDTO>} Test case data
   * @throws {NotFoundError} If test case not found
   */
  async getTestCaseById(id: string): Promise<TestCaseResponseDTO> {
    const testCase = await this.testCaseRepository.findById(id);
    
    if (!testCase) {
      throw new NotFoundError('Test case not found', 'TESTCASE_NOT_FOUND');
    }
    
    return new TestCaseResponseDTO({
      id: testCase.id,
      questionId: testCase.questionId,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      weight: testCase.weight,
      createdAt: testCase.createdAt
    });
  }

  /**
   * Creates a new test case.
   * 
   * @async
   * @param {CreateTestCaseDTO} data - Test case data (questionId, input, expectedOutput, weight)
   * @returns {Promise<TestCaseResponseDTO>} Created test case
   */
  async createTestCase(data: CreateTestCaseDTO): Promise<TestCaseResponseDTO> {
    const testCase = await this.testCaseRepository.create({
      questionId: data.questionId,
      input: data.input,
      expectedOutput: data.expectedOutput,
      weight: data.weight ?? 1
    });
    
    return new TestCaseResponseDTO({
      id: testCase.id,
      questionId: testCase.questionId,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      weight: testCase.weight,
      createdAt: testCase.createdAt
    });
  }

  /**
   * Updates a test case by ID.
   * 
   * @async
   * @param {string} id - The test case ID
   * @param {UpdateTestCaseDTO} data - Updated data
   * @returns {Promise<TestCaseResponseDTO>} Updated test case
   * @throws {NotFoundError} If test case not found
   * @throws {InternalServerError} If update fails
   */
  async updateTestCase(id: string, data: UpdateTestCaseDTO): Promise<TestCaseResponseDTO> {
    const testCase = await this.testCaseRepository.findById(id);
    
    if (!testCase) {
      throw new NotFoundError('Test case not found', 'TESTCASE_NOT_FOUND');
    }
    
    const updateData: DeepPartial<typeof testCase> = {};
    if (data.input !== undefined) updateData.input = data.input;
    if (data.expectedOutput !== undefined) updateData.expectedOutput = data.expectedOutput;
    if (data.weight !== undefined) updateData.weight = data.weight;
    
    const updated = await this.testCaseRepository.update(id, updateData);
    
    if (!updated) {
      throw new InternalServerError('Error updating test case', 'UPDATE_ERROR');
    }
    
    return new TestCaseResponseDTO({
      id: updated.id,
      questionId: updated.questionId,
      input: updated.input,
      expectedOutput: updated.expectedOutput,
      weight: updated.weight,
      createdAt: updated.createdAt
    });
  }

  /**
   * Deletes a test case by ID.
   * 
   * @async
   * @param {string} id - The test case ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If test case not found
   */
  async deleteTestCase(id: string): Promise<void> {
    const testCase = await this.testCaseRepository.findById(id);
    
    if (!testCase) {
      throw new NotFoundError('Test case not found', 'TESTCASE_NOT_FOUND');
    }
    
    await this.testCaseRepository.delete(id);
  }

  /**
   * Deletes all test cases for a question.
   * 
   * @async
   * @param {string} questionId - The question ID
   * @returns {Promise<void>}
   */
  async deleteTestCasesByQuestion(questionId: string): Promise<void> {
    const testCases = await this.testCaseRepository.findByQuestion(questionId);
    
    for (const testCase of testCases) {
      await this.testCaseRepository.delete(testCase.id);
    }
  }
}

