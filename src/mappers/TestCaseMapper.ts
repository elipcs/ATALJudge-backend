import { TestCase } from '../models/TestCase';
import { TestCaseResponseDTO } from '../dtos/TestCaseDtos';

export class TestCaseMapper {
  static toDTO(testCase: TestCase): TestCaseResponseDTO {
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
}
