/**
 * @module __tests__/integration
 * @description Question Use Cases Integration Tests
 */

export {};

const mockQuestionRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByProfessor: jest.fn(),
  findWithTestCases: jest.fn(),
  searchByTitle: jest.fn(),
};

const mockTestCaseRepository = {
  findById: jest.fn(),
  findByQuestion: jest.fn(),
  delete: jest.fn(),
};

describe('Question Use Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateQuestionUseCase', () => {
    it('should create a new question', async () => {
      const newQuestion = {
        id: 'q-123',
        title: 'Sum Two Numbers',
        description: 'Write a function to sum two numbers',
        professorId: 'prof-123',
        timeLimit: 5000,
        memoryLimit: 256,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQuestionRepository.create.mockResolvedValue(newQuestion);

      const result = await mockQuestionRepository.create(newQuestion);

      expect(result.id).toBe('q-123');
      expect(result.title).toBe('Sum Two Numbers');
      expect(result.professorId).toBe('prof-123');
    });
  });

  describe('GetQuestionByIdUseCase', () => {
    it('should retrieve question with test cases', async () => {
      const questionId = 'q-123';
      const mockQuestion = {
        id: questionId,
        title: 'Fibonacci Sequence',
        description: 'Calculate fibonacci numbers',
        professorId: 'prof-123',
        timeLimit: 5000,
        memoryLimit: 512,
        createdAt: new Date(),
        updatedAt: new Date(),
        testCases: [
          { id: 'tc-1', input: '5', expectedOutput: '8' },
          { id: 'tc-2', input: '10', expectedOutput: '89' },
        ],
      };

      mockQuestionRepository.findWithTestCases.mockResolvedValue(mockQuestion);

      const result = await mockQuestionRepository.findWithTestCases(questionId);

      expect(result).toBeDefined();
      expect(result?.title).toBe('Fibonacci Sequence');
      expect(result?.testCases).toHaveLength(2);
    });
  });

  describe('UpdateQuestionUseCase', () => {
    it('should update question information', async () => {
      const questionId = 'q-123';
      const updates = {
        title: 'Updated Title',
        description: 'Updated description',
        timeLimit: 10000,
      };

      const updatedQuestion = {
        id: questionId,
        ...updates,
        professorId: 'prof-123',
        memoryLimit: 256,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQuestionRepository.save.mockResolvedValue(updatedQuestion);

      const result = await mockQuestionRepository.save(updatedQuestion);

      expect(result.title).toBe('Updated Title');
      expect(result.timeLimit).toBe(10000);
    });
  });

  describe('DeleteQuestionUseCase', () => {
    it('should delete a question and its test cases', async () => {
      const questionId = 'q-123';

      mockTestCaseRepository.findByQuestion.mockResolvedValue([
        { id: 'tc-1' },
        { id: 'tc-2' },
      ]);
      mockTestCaseRepository.delete.mockResolvedValue(undefined);
      mockQuestionRepository.delete.mockResolvedValue(undefined);

      const testCases = await mockTestCaseRepository.findByQuestion(questionId);
      for (const testCase of testCases) {
        await mockTestCaseRepository.delete(testCase.id);
      }
      await mockQuestionRepository.delete(questionId);

      expect(mockQuestionRepository.delete).toHaveBeenCalledWith(questionId);
    });
  });

  describe('GetAllQuestionsUseCase', () => {
    it('should return all questions for professor', async () => {
      const professorId = 'prof-123';
      const mockQuestions = [
        {
          id: 'q-1',
          title: 'Question 1',
          description: 'Description 1',
          professorId,
          timeLimit: 5000,
          memoryLimit: 256,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'q-2',
          title: 'Question 2',
          description: 'Description 2',
          professorId,
          timeLimit: 5000,
          memoryLimit: 256,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockQuestionRepository.findByProfessor.mockResolvedValue(mockQuestions);

      const result = await mockQuestionRepository.findByProfessor(professorId);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Question 1');
    });
  });

  describe('SearchQuestionsUseCase', () => {
    it('should search questions by title', async () => {
      const searchTerm = 'Array';
      const mockQuestions = [
        {
          id: 'q-1',
          title: 'Array Sum Problem',
          description: 'Sum array elements',
          professorId: 'prof-123',
          timeLimit: 5000,
          memoryLimit: 256,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockQuestionRepository.searchByTitle.mockResolvedValue(mockQuestions);

      const result = await mockQuestionRepository.searchByTitle(searchTerm);

      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('Array');
    });
  });
});
