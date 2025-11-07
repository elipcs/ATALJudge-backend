/**
 * @module __tests__/services
 * @description Question Service Unit Tests
 */

class QuestionServiceDemo {
  constructor(
    private questionRepository: any,
    private testCaseRepository: any
  ) {}

  async createQuestion(data: any) {
    if (!data.title || !data.professorId) {
      throw new Error('Missing required fields');
    }

    if (data.timeLimit !== undefined && data.timeLimit !== null && data.timeLimit < 1) {
      throw new Error('Time limit must be at least 1 second');
    }

    if (data.memoryLimit !== undefined && data.memoryLimit !== null && data.memoryLimit < 1) {
      throw new Error('Memory limit must be at least 1 MB');
    }

    const newQuestion = {
      id: `question-${Date.now()}`,
      ...data,
      testCases: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.questionRepository.save(newQuestion);
    return newQuestion;
  }

  async getQuestionById(id: string, includeTestCases: boolean = false) {
    const question = await this.questionRepository.findById(id);
    if (!question) throw new Error('Question not found');

    if (includeTestCases) {
      const testCases = await this.testCaseRepository.findByQuestion(id);
      return { ...question, testCases };
    }

    return question;
  }

  async updateQuestion(id: string, data: any) {
    const question = await this.questionRepository.findById(id);
    if (!question) throw new Error('Question not found');

    const updated = { ...question, ...data, updatedAt: new Date() };
    await this.questionRepository.save(updated);
    return updated;
  }

  async deleteQuestion(id: string) {
    const question = await this.questionRepository.findById(id);
    if (!question) throw new Error('Question not found');

    await this.testCaseRepository.deleteByQuestion(id);
    await this.questionRepository.delete(id);
    return true;
  }

  async getQuestionsByProfessor(professorId: string) {
    const questions = await this.questionRepository.findByProfessor(professorId);
    return questions || [];
  }

  async searchQuestions(query: string, professorId?: string) {
    const results = await this.questionRepository.search(query, professorId);
    return results || [];
  }

  async getQuestionDifficulty(id: string) {
    const question = await this.questionRepository.findById(id);
    if (!question) throw new Error('Question not found');

    return question.difficulty || 'medium';
  }

  async updateQuestionDifficulty(id: string, difficulty: string) {
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      throw new Error('Invalid difficulty level');
    }

    const question = await this.questionRepository.findById(id);
    if (!question) throw new Error('Question not found');

    const updated = { ...question, difficulty, updatedAt: new Date() };
    await this.questionRepository.save(updated);
    return updated;
  }

  async getQuestionCount(professorId: string) {
    const questions = await this.questionRepository.findByProfessor(professorId);
    return questions?.length || 0;
  }

  async getQuestionsForList(listId: string) {
    const questions = await this.questionRepository.findByList(listId);
    return questions || [];
  }

  async validateQuestionData(data: any) {
    const errors: string[] = [];

    if (!data.title) errors.push('Title is required');
    if (!data.professorId) errors.push('Professor ID is required');
    if (data.timeLimit && isNaN(data.timeLimit)) errors.push('Time limit must be a number');
    if (data.memoryLimit && isNaN(data.memoryLimit)) errors.push('Memory limit must be a number');

    return errors;
  }
}

describe('QuestionService', () => {
  let questionService: any;
  let mockQuestionRepository: any;
  let mockTestCaseRepository: any;

  beforeEach(() => {
    mockQuestionRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByProfessor: jest.fn(),
      search: jest.fn(),
      findByList: jest.fn(),
    };

    mockTestCaseRepository = {
      findByQuestion: jest.fn(),
      deleteByQuestion: jest.fn(),
    };

    questionService = new QuestionServiceDemo(mockQuestionRepository, mockTestCaseRepository);
    jest.clearAllMocks();
  });

  describe('createQuestion', () => {
    it('should create a new question successfully', async () => {
      const questionData = {
        title: 'Sum of Two Numbers',
        description: 'Calculate the sum of two numbers',
        professorId: 'prof-123',
        timeLimit: 5,
        memoryLimit: 256,
      };

      mockQuestionRepository.save.mockResolvedValue(true);

      const result = await questionService.createQuestion(questionData);

      expect(result.title).toBe('Sum of Two Numbers');
      expect(result.professorId).toBe('prof-123');
      expect(result.testCases).toEqual([]);
      expect(mockQuestionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when title is missing', async () => {
      const questionData = {
        professorId: 'prof-123',
      };

      await expect(questionService.createQuestion(questionData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw error when professor ID is missing', async () => {
      const questionData = {
        title: 'Sum of Two Numbers',
      };

      await expect(questionService.createQuestion(questionData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw error when time limit is less than 1', async () => {
      const questionData = {
        title: 'Test Question',
        professorId: 'prof-123',
        timeLimit: 0,
      };

      await expect(questionService.createQuestion(questionData)).rejects.toThrow(
        'Time limit must be at least 1 second'
      );
    });

    it('should throw error when memory limit is less than 1', async () => {
      const questionData = {
        title: 'Test Question',
        professorId: 'prof-123',
        memoryLimit: 0,
      };

      await expect(questionService.createQuestion(questionData)).rejects.toThrow(
        'Memory limit must be at least 1 MB'
      );
    });

    it('should set timestamps on new question', async () => {
      const questionData = {
        title: 'Test Question',
        professorId: 'prof-123',
      };

      mockQuestionRepository.save.mockResolvedValue(true);

      const result = await questionService.createQuestion(questionData);

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.createdAt instanceof Date).toBe(true);
    });
  });

  describe('getQuestionById', () => {
    it('should retrieve question by id without test cases', async () => {
      const mockQuestion = {
        id: 'q-123',
        title: 'Sum of Two Numbers',
        professorId: 'prof-123',
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);

      const result = await questionService.getQuestionById('q-123', false);

      expect(result.id).toBe('q-123');
      expect(result.title).toBe('Sum of Two Numbers');
      expect(mockTestCaseRepository.findByQuestion).not.toHaveBeenCalled();
    });

    it('should retrieve question by id with test cases', async () => {
      const mockQuestion = {
        id: 'q-123',
        title: 'Sum of Two Numbers',
      };

      const mockTestCases = [
        { id: 'tc-1', input: '2 3', expected: '5' },
        { id: 'tc-2', input: '5 10', expected: '15' },
      ];

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockTestCaseRepository.findByQuestion.mockResolvedValue(mockTestCases);

      const result = await questionService.getQuestionById('q-123', true);

      expect(result.testCases).toHaveLength(2);
      expect(result.testCases[0].input).toBe('2 3');
      expect(mockTestCaseRepository.findByQuestion).toHaveBeenCalledWith('q-123');
    });

    it('should throw error when question not found', async () => {
      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(questionService.getQuestionById('invalid-id')).rejects.toThrow(
        'Question not found'
      );
    });
  });

  describe('updateQuestion', () => {
    it('should update question successfully', async () => {
      const existingQuestion = {
        id: 'q-123',
        title: 'Sum of Two Numbers',
        professorId: 'prof-123',
      };

      const updateData = {
        title: 'Sum of Multiple Numbers',
        difficulty: 'hard',
      };

      mockQuestionRepository.findById.mockResolvedValue(existingQuestion);
      mockQuestionRepository.save.mockResolvedValue(true);

      const result = await questionService.updateQuestion('q-123', updateData);

      expect(result.title).toBe('Sum of Multiple Numbers');
      expect(result.difficulty).toBe('hard');
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error when question not found on update', async () => {
      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(
        questionService.updateQuestion('invalid-id', { title: 'New Title' })
      ).rejects.toThrow('Question not found');
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question and its test cases successfully', async () => {
      const mockQuestion = {
        id: 'q-123',
        title: 'Sum of Two Numbers',
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockTestCaseRepository.deleteByQuestion.mockResolvedValue(true);
      mockQuestionRepository.delete.mockResolvedValue(true);

      const result = await questionService.deleteQuestion('q-123');

      expect(result).toBe(true);
      expect(mockTestCaseRepository.deleteByQuestion).toHaveBeenCalledWith('q-123');
      expect(mockQuestionRepository.delete).toHaveBeenCalledWith('q-123');
    });

    it('should throw error when question not found on delete', async () => {
      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(questionService.deleteQuestion('invalid-id')).rejects.toThrow(
        'Question not found'
      );
    });
  });

  describe('getQuestionsByProfessor', () => {
    it('should retrieve all questions by professor', async () => {
      const mockQuestions = [
        { id: 'q-1', title: 'Question 1' },
        { id: 'q-2', title: 'Question 2' },
        { id: 'q-3', title: 'Question 3' },
      ];

      mockQuestionRepository.findByProfessor.mockResolvedValue(mockQuestions);

      const result = await questionService.getQuestionsByProfessor('prof-123');

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Question 1');
    });

    it('should return empty array when professor has no questions', async () => {
      mockQuestionRepository.findByProfessor.mockResolvedValue(null);

      const result = await questionService.getQuestionsByProfessor('prof-999');

      expect(result).toEqual([]);
    });
  });

  describe('searchQuestions', () => {
    it('should search questions by query', async () => {
      const mockResults = [
        { id: 'q-1', title: 'Sum of Two Numbers' },
        { id: 'q-2', title: 'Sum of Array' },
      ];

      mockQuestionRepository.search.mockResolvedValue(mockResults);

      const result = await questionService.searchQuestions('Sum', 'prof-123');

      expect(result).toHaveLength(2);
      expect(mockQuestionRepository.search).toHaveBeenCalledWith('Sum', 'prof-123');
    });

    it('should return empty array when no questions match search', async () => {
      mockQuestionRepository.search.mockResolvedValue(null);

      const result = await questionService.searchQuestions('NonExistent', 'prof-123');

      expect(result).toEqual([]);
    });
  });

  describe('getQuestionDifficulty', () => {
    it('should return question difficulty', async () => {
      const mockQuestion = {
        id: 'q-123',
        title: 'Test Question',
        difficulty: 'hard',
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);

      const result = await questionService.getQuestionDifficulty('q-123');

      expect(result).toBe('hard');
    });

    it('should return default difficulty when not set', async () => {
      const mockQuestion = {
        id: 'q-123',
        title: 'Test Question',
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);

      const result = await questionService.getQuestionDifficulty('q-123');

      expect(result).toBe('medium');
    });

    it('should throw error when question not found', async () => {
      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(questionService.getQuestionDifficulty('invalid-id')).rejects.toThrow(
        'Question not found'
      );
    });
  });

  describe('updateQuestionDifficulty', () => {
    it('should update question difficulty successfully', async () => {
      const mockQuestion = {
        id: 'q-123',
        title: 'Test Question',
        difficulty: 'easy',
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockQuestionRepository.save.mockResolvedValue(true);

      const result = await questionService.updateQuestionDifficulty('q-123', 'hard');

      expect(result.difficulty).toBe('hard');
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error for invalid difficulty level', async () => {
      const mockQuestion = {
        id: 'q-123',
        title: 'Test Question',
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);

      await expect(
        questionService.updateQuestionDifficulty('q-123', 'invalid')
      ).rejects.toThrow('Invalid difficulty level');
    });

    it('should throw error when question not found', async () => {
      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(
        questionService.updateQuestionDifficulty('invalid-id', 'hard')
      ).rejects.toThrow('Question not found');
    });
  });

  describe('getQuestionCount', () => {
    it('should return count of questions for professor', async () => {
      const mockQuestions = [
        { id: 'q-1' },
        { id: 'q-2' },
        { id: 'q-3' },
        { id: 'q-4' },
      ];

      mockQuestionRepository.findByProfessor.mockResolvedValue(mockQuestions);

      const result = await questionService.getQuestionCount('prof-123');

      expect(result).toBe(4);
    });

    it('should return 0 when professor has no questions', async () => {
      mockQuestionRepository.findByProfessor.mockResolvedValue(null);

      const result = await questionService.getQuestionCount('prof-999');

      expect(result).toBe(0);
    });
  });

  describe('getQuestionsForList', () => {
    it('should retrieve questions for a list', async () => {
      const mockQuestions = [
        { id: 'q-1', title: 'Question 1' },
        { id: 'q-2', title: 'Question 2' },
      ];

      mockQuestionRepository.findByList.mockResolvedValue(mockQuestions);

      const result = await questionService.getQuestionsForList('list-123');

      expect(result).toHaveLength(2);
    });

    it('should return empty array when list has no questions', async () => {
      mockQuestionRepository.findByList.mockResolvedValue(null);

      const result = await questionService.getQuestionsForList('list-999');

      expect(result).toEqual([]);
    });
  });

  describe('validateQuestionData', () => {
    it('should return no errors for valid data', async () => {
      const data = {
        title: 'Valid Question',
        professorId: 'prof-123',
      };

      const errors = await questionService.validateQuestionData(data);

      expect(errors).toHaveLength(0);
    });

    it('should return error for missing title', async () => {
      const data = {
        professorId: 'prof-123',
      };

      const errors = await questionService.validateQuestionData(data);

      expect(errors).toContain('Title is required');
    });

    it('should return error for missing professor ID', async () => {
      const data = {
        title: 'Test Question',
      };

      const errors = await questionService.validateQuestionData(data);

      expect(errors).toContain('Professor ID is required');
    });

    it('should return multiple errors', async () => {
      const data = {
        timeLimit: 'invalid',
        memoryLimit: 'invalid',
      };

      const errors = await questionService.validateQuestionData(data);

      expect(errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
