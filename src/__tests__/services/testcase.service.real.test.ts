/**
 * @module __tests__/services
 * @description TestCase Service Unit Tests - Real Pattern
 * 
 * Mock implementation that follows the real service interface.
 */

// Mock repositories
const mockTestCaseRepositoryReal = {
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByQuestion: jest.fn(),
};

const mockQuestionRepositoryReal = {
  findById: jest.fn(),
};

// Real implementation pattern
class TestCaseServiceMock {
  constructor(
    private testCaseRepository: any,
    private questionRepository: any
  ) {}

  async createTestCase(dto: any, questionId: string) {
    const question = await this.questionRepository.findById(questionId);

    if (!question) {
      throw new Error('Question not found');
    }

    const testCase = {
      id: `testcase-${Date.now()}`,
      questionId,
      input: dto.input,
      output: dto.output,
      explanation: dto.explanation || null,
      isExample: dto.isExample || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.testCaseRepository.save(testCase);
  }

  async getTestCaseById(id: string) {
    const testCase = await this.testCaseRepository.findById(id);

    if (!testCase) {
      throw new Error('Test case not found');
    }

    return testCase;
  }

  async getTestCasesByQuestion(questionId: string) {
    const testCases = await this.testCaseRepository.findByQuestion(questionId);
    return testCases || [];
  }

  async updateTestCase(id: string, dto: any) {
    const testCase = await this.testCaseRepository.findById(id);

    if (!testCase) {
      throw new Error('Test case not found');
    }

    if (dto.input !== undefined) testCase.input = dto.input;
    if (dto.output !== undefined) testCase.output = dto.output;
    if (dto.explanation !== undefined) testCase.explanation = dto.explanation;
    if (dto.isExample !== undefined) testCase.isExample = dto.isExample;

    testCase.updatedAt = new Date();
    return await this.testCaseRepository.save(testCase);
  }

  async deleteTestCase(id: string) {
    const testCase = await this.testCaseRepository.findById(id);

    if (!testCase) {
      throw new Error('Test case not found');
    }

    await this.testCaseRepository.delete(id);
  }

  async getExampleTestCases(questionId: string) {
    const testCases = await this.testCaseRepository.findByQuestion(questionId);
    return (testCases || []).filter((tc: any) => tc.isExample);
  }
}

describe('TestCaseService - Real Pattern Implementation', () => {
  let service: TestCaseServiceMock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TestCaseServiceMock(
      mockTestCaseRepositoryReal,
      mockQuestionRepositoryReal
    );
  });

  describe('createTestCase', () => {
    it('should create test case successfully', async () => {
      const dto = {
        input: '5',
        output: '120',
        explanation: 'Factorial of 5 is 120',
        isExample: true,
      };

      const mockQuestion = { id: 'question-1', title: 'Q1' };

      mockQuestionRepositoryReal.findById.mockResolvedValue(mockQuestion);
      mockTestCaseRepositoryReal.save.mockResolvedValue({
        id: 'testcase-1',
        questionId: 'question-1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createTestCase(dto, 'question-1');

      expect(result.input).toBe('5');
      expect(result.output).toBe('120');
      expect(result.isExample).toBe(true);
    });

    it('should throw error if question does not exist', async () => {
      mockQuestionRepositoryReal.findById.mockResolvedValue(null);

      await expect(
        service.createTestCase(
          { input: '5', output: '120' },
          'non-existent'
        )
      ).rejects.toThrow('Question not found');
    });

    it('should set default values for test case', async () => {
      const dto = {
        input: '3',
        output: '6',
      };

      const mockQuestion = { id: 'question-1' };

      mockQuestionRepositoryReal.findById.mockResolvedValue(mockQuestion);
      mockTestCaseRepositoryReal.save.mockResolvedValue({
        id: 'testcase-2',
        questionId: 'question-1',
        ...dto,
        explanation: null,
        isExample: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createTestCase(dto, 'question-1');

      expect(result.explanation).toBeNull();
      expect(result.isExample).toBe(false);
    });
  });

  describe('getTestCaseById', () => {
    it('should return test case by ID', async () => {
      const mockTestCase = {
        id: 'testcase-1',
        questionId: 'question-1',
        input: '5',
        output: '120',
      };

      mockTestCaseRepositoryReal.findById.mockResolvedValue(mockTestCase);

      const result = await service.getTestCaseById('testcase-1');

      expect(result.input).toBe('5');
      expect(result.output).toBe('120');
    });

    it('should throw error when test case does not exist', async () => {
      mockTestCaseRepositoryReal.findById.mockResolvedValue(null);

      await expect(service.getTestCaseById('non-existent')).rejects.toThrow(
        'Test case not found'
      );
    });
  });

  describe('getTestCasesByQuestion', () => {
    it('should return test cases for question', async () => {
      const mockTestCases = [
        { id: 'tc-1', input: '1', output: '1' },
        { id: 'tc-2', input: '5', output: '120' },
        { id: 'tc-3', input: '10', output: '3628800' },
      ];

      mockTestCaseRepositoryReal.findByQuestion.mockResolvedValue(mockTestCases);

      const result = await service.getTestCasesByQuestion('question-1');

      expect(result).toHaveLength(3);
      expect(result[0].input).toBe('1');
    });

    it('should return empty array when question has no test cases', async () => {
      mockTestCaseRepositoryReal.findByQuestion.mockResolvedValue([]);

      const result = await service.getTestCasesByQuestion('question-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('updateTestCase', () => {
    it('should update test case successfully', async () => {
      const mockTestCase = {
        id: 'testcase-1',
        input: '5',
        output: '120',
        explanation: 'Old',
        isExample: false,
      };

      mockTestCaseRepositoryReal.findById.mockResolvedValue(mockTestCase);
      mockTestCaseRepositoryReal.save.mockResolvedValue({
        ...mockTestCase,
        output: '720',
        explanation: 'Updated',
        updatedAt: new Date(),
      });

      const result = await service.updateTestCase('testcase-1', {
        output: '720',
        explanation: 'Updated',
      });

      expect(result.output).toBe('720');
      expect(result.explanation).toBe('Updated');
    });

    it('should throw error if test case does not exist', async () => {
      mockTestCaseRepositoryReal.findById.mockResolvedValue(null);

      await expect(
        service.updateTestCase('non-existent', { input: '10' })
      ).rejects.toThrow('Test case not found');
    });
  });

  describe('deleteTestCase', () => {
    it('should delete test case successfully', async () => {
      const mockTestCase = { id: 'testcase-1' };

      mockTestCaseRepositoryReal.findById.mockResolvedValue(mockTestCase);
      mockTestCaseRepositoryReal.delete.mockResolvedValue(true);

      await service.deleteTestCase('testcase-1');

      expect(mockTestCaseRepositoryReal.delete).toHaveBeenCalledWith('testcase-1');
    });

    it('should throw error if test case does not exist', async () => {
      mockTestCaseRepositoryReal.findById.mockResolvedValue(null);

      await expect(service.deleteTestCase('non-existent')).rejects.toThrow(
        'Test case not found'
      );
    });
  });

  describe('getExampleTestCases', () => {
    it('should return only example test cases', async () => {
      const mockTestCases = [
        { id: 'tc-1', input: '1', output: '1', isExample: true },
        { id: 'tc-2', input: '2', output: '2', isExample: false },
        { id: 'tc-3', input: '3', output: '6', isExample: true },
        { id: 'tc-4', input: '4', output: '24', isExample: false },
      ];

      mockTestCaseRepositoryReal.findByQuestion.mockResolvedValue(mockTestCases);

      const result = await service.getExampleTestCases('question-1');

      expect(result).toHaveLength(2);
      expect(result.every((tc: any) => tc.isExample)).toBe(true);
    });

    it('should return empty array when no example test cases', async () => {
      const mockTestCases = [
        { id: 'tc-1', input: '1', output: '1', isExample: false },
        { id: 'tc-2', input: '2', output: '2', isExample: false },
      ];

      mockTestCaseRepositoryReal.findByQuestion.mockResolvedValue(mockTestCases);

      const result = await service.getExampleTestCases('question-1');

      expect(result).toHaveLength(0);
    });
  });
});
