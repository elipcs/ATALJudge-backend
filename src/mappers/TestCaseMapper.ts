/**
 * Test Case Data Mapper
 * 
 * Maps between TestCase domain models and DTOs.
 * Handles conversion of TestCase entities to data transfer objects for API responses.
 * 
 * @module mappers/TestCaseMapper
 */
import { TestCase } from '../models/TestCase';
import { TestCaseResponseDTO } from '../dtos/TestCaseDtos';

/**
 * Test Case Mapper Class
 * 
 * Provides static methods for converting between TestCase domain objects and DTOs.
 * 
 * @class TestCaseMapper
 */
export class TestCaseMapper {
  /**
   * Converts a TestCase domain model to TestCaseResponseDTO
   * 
   * @static
   * @param {TestCase} testCase - The test case domain model
   * @returns {TestCaseResponseDTO} The test case data transfer object
   */
  static toDTO(testCase: TestCase): TestCaseResponseDTO {
    // Garantir que todos os campos sejam válidos (não null/undefined)
    return new TestCaseResponseDTO({
      id: testCase.id || '',
      questionId: testCase.questionId || '',
      input: testCase.input || '',
      expectedOutput: testCase.expectedOutput || '',
      weight: testCase.weight ?? 0,
      createdAt: testCase.createdAt || new Date()
    });
  }
}
