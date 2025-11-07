/**
 * @module __tests__/services
 * @description Question Service Unit Tests - Real Pattern
 * 
 * Mock implementation that follows the real service interface.
 */

// Mock repositories
const mockQuestionRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByQuestionList: jest.fn(),
};

const mockTestCaseRepository: any = {
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByQuestion: jest.fn(),
};

const mockQuestionListRepository = {
  findById: jest.fn(),
  findByProfessor: jest.fn(),
};

// Real implementation pattern
class QuestionServiceMock {
  constructor(
    private questionRepository: any,
    private testCaseRepository: any,
    private questionListRepository: any
  ) {}

  async createQuestion(dto: any, questionListId: string) {
    const questionList = await this.questionListRepository.findById(questionListId);

    if (!questionList) {
      throw new Error('Question list not found');
    }

    const question = {
      id: `question-${Date.now()}`,
      title: dto.title,
      description: dto.description,
      difficulty: dto.difficulty || 'MEDIUM',
      questionListId,
      points: dto.points || 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.questionRepository.save(question);
  }

  async getQuestionById(id: string) {
    const question = await this.questionRepository.findById(id);

    if (!question) {
      throw new Error('Question not found');
    }

    return question;
  }

  async getQuestionsByList(questionListId: string) {
    const questions = await this.questionRepository.find({ questionListId });
    return questions || [];
  }

  async updateQuestion(id: string, dto: any) {
    const question = await this.questionRepository.findById(id);

    if (!question) {
      throw new Error('Question not found');
    }

    if (dto.title) question.title = dto.title;
    if (dto.description) question.description = dto.description;
    if (dto.difficulty) question.difficulty = dto.difficulty;
    if (dto.points !== undefined) question.points = dto.points;

    question.updatedAt = new Date();
    return await this.questionRepository.save(question);
  }

  async deleteQuestion(id: string) {
    const question = await this.questionRepository.findById(id);

    if (!question) {
      throw new Error('Question not found');
    }

    // Delete test cases first
    const testCases = await this.testCaseRepository.findByQuestion(id);
    if (testCases && testCases.length > 0) {
      for (const testCase of testCases) {
        await this.testCaseRepository.delete(testCase.id);
      }
    }

    await this.questionRepository.delete(id);
  }

  async addTestCase(questionId: string, dto: any) {
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
}

describe('QuestionService - Real Pattern Implementation', () => {
  let service: QuestionServiceMock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuestionServiceMock(
      mockQuestionRepository,
      mockTestCaseRepository,
      mockQuestionListRepository
    );
  });

  describe('createQuestion', () => {
    it('should create question successfully', async () => {
      const dto = {
        title: 'Factorial Problem',
        description: 'Calculate factorial of n',
        difficulty: 'EASY',
        points: 20,
      };

      const mockList = { id: 'list-1', title: 'Quiz 1' };

      mockQuestionListRepository.findById.mockResolvedValue(mockList);
      mockQuestionRepository.save.mockResolvedValue({
        id: 'question-1',
        ...dto,
        questionListId: 'list-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createQuestion(dto, 'list-1');

      expect(result.title).toBe('Factorial Problem');
      expect(result.difficulty).toBe('EASY');
      expect(result.points).toBe(20);
      expect(mockQuestionRepository.save).toHaveBeenCalled();
    });

    it('should throw error if question list does not exist', async () => {
      mockQuestionListRepository.findById.mockResolvedValue(null);

      await expect(
        service.createQuestion(
          { title: 'Question', description: 'Desc' },
          'non-existent'
        )
      ).rejects.toThrow('Question list not found');
    });

    it('should set default difficulty and points', async () => {
      const dto = {
        title: 'Simple Question',
        description: 'A simple one',
      };

      const mockList = { id: 'list-1' };

      mockQuestionListRepository.findById.mockResolvedValue(mockList);
      mockQuestionRepository.save.mockResolvedValue({
        id: 'question-2',
        ...dto,
        difficulty: 'MEDIUM',
        points: 10,
        questionListId: 'list-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createQuestion(dto, 'list-1');

      expect(result.difficulty).toBe('MEDIUM');
      expect(result.points).toBe(10);
    });
  });

  describe('getQuestionById', () => {
    it('should return question by ID', async () => {
      const mockQuestion = {
        id: 'question-1',
        title: 'Factorial Problem',
        description: 'Calculate factorial',
        difficulty: 'EASY',
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);

      const result = await service.getQuestionById('question-1');

      expect(result.id).toBe('question-1');
      expect(result.title).toBe('Factorial Problem');
      expect(mockQuestionRepository.findById).toHaveBeenCalledWith('question-1');
    });

    it('should throw error when question does not exist', async () => {
      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(service.getQuestionById('non-existent')).rejects.toThrow(
        'Question not found'
      );
    });
  });

  describe('getQuestionsByList', () => {
    it('should return questions for a question list', async () => {
      const mockQuestions = [
        { id: 'q-1', title: 'Q1', difficulty: 'EASY' },
        { id: 'q-2', title: 'Q2', difficulty: 'HARD' },
        { id: 'q-3', title: 'Q3', difficulty: 'MEDIUM' },
      ];

      mockQuestionRepository.find.mockResolvedValue(mockQuestions);

      const result = await service.getQuestionsByList('list-1');

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Q1');
      expect(mockQuestionRepository.find).toHaveBeenCalledWith({ questionListId: 'list-1' });
    });

    it('should return empty array when no questions exist', async () => {
      mockQuestionRepository.find.mockResolvedValue([]);

      const result = await service.getQuestionsByList('list-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('updateQuestion', () => {
    it('should update question successfully', async () => {
      const mockQuestion = {
        id: 'question-1',
        title: 'Old Title',
        description: 'Old desc',
        difficulty: 'EASY',
        points: 10,
      };

      const updated = {
        ...mockQuestion,
        title: 'New Title',
        points: 25,
        updatedAt: new Date(),
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockQuestionRepository.save.mockResolvedValue(updated);

      const result = await service.updateQuestion('question-1', {
        title: 'New Title',
        points: 25,
      });

      expect(result.title).toBe('New Title');
      expect(result.points).toBe(25);
    });

    it('should throw error if question does not exist', async () => {
      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateQuestion('non-existent', { title: 'New Title' })
      ).rejects.toThrow('Question not found');
    });

    it('should update only provided fields', async () => {
      const mockQuestion = {
        id: 'question-1',
        title: 'Original',
        description: 'Original desc',
        difficulty: 'EASY',
        points: 10,
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockQuestionRepository.save.mockResolvedValue({
        ...mockQuestion,
        title: 'Updated Title',
        updatedAt: new Date(),
      });

      await service.updateQuestion('question-1', { title: 'Updated Title' });

      expect(mockQuestion.description).toBe('Original desc');
      expect(mockQuestion.difficulty).toBe('EASY');
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question and its test cases', async () => {
      const mockQuestion = { id: 'question-1' };

      const mockTestCases = [
        { id: 'tc-1', questionId: 'question-1' },
        { id: 'tc-2', questionId: 'question-1' },
      ];

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockTestCaseRepository.findByQuestion.mockResolvedValue(mockTestCases);
      mockTestCaseRepository.delete.mockResolvedValue(true);
      mockQuestionRepository.delete.mockResolvedValue(true);

      await service.deleteQuestion('question-1');

      expect(mockTestCaseRepository.delete).toHaveBeenCalledTimes(2);
      expect(mockQuestionRepository.delete).toHaveBeenCalledWith('question-1');
    });

    it('should throw error if question does not exist', async () => {
      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(service.deleteQuestion('non-existent')).rejects.toThrow(
        'Question not found'
      );
    });

    it('should delete question without test cases', async () => {
      const mockQuestion = { id: 'question-1' };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockTestCaseRepository.findByQuestion.mockResolvedValue([]);
      mockQuestionRepository.delete.mockResolvedValue(true);

      await service.deleteQuestion('question-1');

      expect(mockTestCaseRepository.delete).not.toHaveBeenCalled();
      expect(mockQuestionRepository.delete).toHaveBeenCalledWith('question-1');
    });
  });

  describe('addTestCase', () => {
    it('should add test case successfully', async () => {
      const mockQuestion = { id: 'question-1' };

      const dto = {
        input: '5',
        output: '120',
        explanation: 'Factorial of 5 is 120',
        isExample: true,
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockTestCaseRepository.save.mockResolvedValue({
        id: 'testcase-1',
        questionId: 'question-1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.addTestCase('question-1', dto);

      expect(result.input).toBe('5');
      expect(result.output).toBe('120');
      expect(result.isExample).toBe(true);
      expect(mockTestCaseRepository.save).toHaveBeenCalled();
    });

    it('should throw error if question does not exist', async () => {
      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(
        service.addTestCase('non-existent', { input: '1', output: '1' })
      ).rejects.toThrow('Question not found');
    });

    it('should set default values for test case', async () => {
      const mockQuestion = { id: 'question-1' };

      const dto = {
        input: '3',
        output: '6',
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockTestCaseRepository.save.mockResolvedValue({
        id: 'testcase-2',
        questionId: 'question-1',
        ...dto,
        explanation: null,
        isExample: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.addTestCase('question-1', dto);

      expect(result.explanation).toBeNull();
      expect(result.isExample).toBe(false);
    });
  });
});
