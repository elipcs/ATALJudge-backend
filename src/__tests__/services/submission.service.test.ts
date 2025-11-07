/**
 * @module __tests__/services
 * @description Submission Service Unit Tests
 */

class SubmissionServiceDemo {
  constructor(
    private submissionRepository: any,
    private submissionResultRepository: any,
    private questionRepository: any
  ) {}

  async createSubmission(data: any) {
    if (!data.studentId || !data.questionId || !data.code) {
      throw new Error('Missing required fields');
    }

    const question = await this.questionRepository.findById(data.questionId);
    if (!question) throw new Error('Question not found');

    const newSubmission = {
      id: `submission-${Date.now()}`,
      ...data,
      status: 'pending',
      verdict: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.submissionRepository.save(newSubmission);
    return newSubmission;
  }

  async getSubmissionById(id: string, includeResults: boolean = false) {
    const submission = await this.submissionRepository.findById(id);
    if (!submission) throw new Error('Submission not found');

    if (includeResults) {
      const results = await this.submissionResultRepository.findBySubmission(id);
      return { ...submission, results };
    }

    return submission;
  }

  async updateSubmissionStatus(id: string, status: string) {
    const validStatuses = ['pending', 'running', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const submission = await this.submissionRepository.findById(id);
    if (!submission) throw new Error('Submission not found');

    const updated = { ...submission, status, updatedAt: new Date() };
    await this.submissionRepository.save(updated);
    return updated;
  }

  async updateSubmissionVerdict(id: string, verdict: string) {
    const validVerdicts = ['accepted', 'wrong_answer', 'time_limit', 'memory_limit', 'compilation_error', 'runtime_error'];
    if (!validVerdicts.includes(verdict)) {
      throw new Error('Invalid verdict');
    }

    const submission = await this.submissionRepository.findById(id);
    if (!submission) throw new Error('Submission not found');

    const updated = { ...submission, verdict, updatedAt: new Date() };
    await this.submissionRepository.save(updated);
    return updated;
  }

  async getSubmissionsByStudent(studentId: string, limit?: number) {
    const submissions = await this.submissionRepository.findByStudent(studentId);
    if (!submissions) return [];
    return limit ? submissions.slice(0, limit) : submissions;
  }

  async getSubmissionsByQuestion(questionId: string) {
    const submissions = await this.submissionRepository.findByQuestion(questionId);
    return submissions || [];
  }

  async getLatestSubmission(studentId: string, questionId: string) {
    const submission = await this.submissionRepository.findLatest(studentId, questionId);
    if (!submission) throw new Error('No submission found');
    return submission;
  }

  async countSubmissionsByStatus(studentId: string) {
    const submissions = await this.submissionRepository.findByStudent(studentId);
    if (!submissions) return { pending: 0, running: 0, completed: 0, failed: 0 };

    const counts = {
      pending: submissions.filter((s: any) => s.status === 'pending').length,
      running: submissions.filter((s: any) => s.status === 'running').length,
      completed: submissions.filter((s: any) => s.status === 'completed').length,
      failed: submissions.filter((s: any) => s.status === 'failed').length,
    };

    return counts;
  }

  async deleteSubmission(id: string) {
    const submission = await this.submissionRepository.findById(id);
    if (!submission) throw new Error('Submission not found');

    await this.submissionResultRepository.deleteBySubmission(id);
    await this.submissionRepository.delete(id);
    return true;
  }

  async getAcceptedCount(studentId: string) {
    const submissions = await this.submissionRepository.findByStudent(studentId);
    if (!submissions) return 0;
    return submissions.filter((s: any) => s.verdict === 'accepted').length;
  }

  async getSubmissionLanguage(id: string) {
    const submission = await this.submissionRepository.findById(id);
    if (!submission) throw new Error('Submission not found');
    return submission.language || 'unknown';
  }
}

describe('SubmissionService', () => {
  let submissionService: any;
  let mockSubmissionRepository: any;
  let mockSubmissionResultRepository: any;
  let mockQuestionRepository: any;

  beforeEach(() => {
    mockSubmissionRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByStudent: jest.fn(),
      findByQuestion: jest.fn(),
      findLatest: jest.fn(),
    };

    mockSubmissionResultRepository = {
      findBySubmission: jest.fn(),
      deleteBySubmission: jest.fn(),
    };

    mockQuestionRepository = {
      findById: jest.fn(),
    };

    submissionService = new SubmissionServiceDemo(
      mockSubmissionRepository,
      mockSubmissionResultRepository,
      mockQuestionRepository
    );
    jest.clearAllMocks();
  });

  describe('createSubmission', () => {
    it('should create a new submission successfully', async () => {
      const submissionData = {
        studentId: 'student-123',
        questionId: 'question-123',
        code: 'print("Hello")',
        language: 'python',
      };

      const mockQuestion = { id: 'question-123', title: 'Test' };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockSubmissionRepository.save.mockResolvedValue(true);

      const result = await submissionService.createSubmission(submissionData);

      expect(result.studentId).toBe('student-123');
      expect(result.status).toBe('pending');
      expect(result.verdict).toBeNull();
      expect(mockSubmissionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when student ID is missing', async () => {
      const submissionData = {
        questionId: 'question-123',
        code: 'print("Hello")',
      };

      await expect(submissionService.createSubmission(submissionData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw error when question ID is missing', async () => {
      const submissionData = {
        studentId: 'student-123',
        code: 'print("Hello")',
      };

      await expect(submissionService.createSubmission(submissionData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw error when code is missing', async () => {
      const submissionData = {
        studentId: 'student-123',
        questionId: 'question-123',
      };

      await expect(submissionService.createSubmission(submissionData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw error when question not found', async () => {
      const submissionData = {
        studentId: 'student-123',
        questionId: 'invalid-id',
        code: 'print("Hello")',
      };

      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(submissionService.createSubmission(submissionData)).rejects.toThrow(
        'Question not found'
      );
    });
  });

  describe('getSubmissionById', () => {
    it('should retrieve submission by id without results', async () => {
      const mockSubmission = {
        id: 'sub-123',
        studentId: 'student-123',
        questionId: 'question-123',
        status: 'completed',
      };

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);

      const result = await submissionService.getSubmissionById('sub-123', false);

      expect(result.id).toBe('sub-123');
      expect(mockSubmissionResultRepository.findBySubmission).not.toHaveBeenCalled();
    });

    it('should retrieve submission by id with results', async () => {
      const mockSubmission = {
        id: 'sub-123',
        studentId: 'student-123',
      };

      const mockResults = [
        { id: 'result-1', testCaseId: 'tc-1', status: 'passed' },
        { id: 'result-2', testCaseId: 'tc-2', status: 'failed' },
      ];

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);
      mockSubmissionResultRepository.findBySubmission.mockResolvedValue(mockResults);

      const result = await submissionService.getSubmissionById('sub-123', true);

      expect(result.results).toHaveLength(2);
      expect(mockSubmissionResultRepository.findBySubmission).toHaveBeenCalledWith('sub-123');
    });

    it('should throw error when submission not found', async () => {
      mockSubmissionRepository.findById.mockResolvedValue(null);

      await expect(submissionService.getSubmissionById('invalid-id')).rejects.toThrow(
        'Submission not found'
      );
    });
  });

  describe('updateSubmissionStatus', () => {
    it('should update submission status successfully', async () => {
      const mockSubmission = {
        id: 'sub-123',
        status: 'pending',
      };

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);
      mockSubmissionRepository.save.mockResolvedValue(true);

      const result = await submissionService.updateSubmissionStatus('sub-123', 'running');

      expect(result.status).toBe('running');
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error for invalid status', async () => {
      const mockSubmission = {
        id: 'sub-123',
        status: 'pending',
      };

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);

      await expect(
        submissionService.updateSubmissionStatus('sub-123', 'invalid_status')
      ).rejects.toThrow('Invalid status');
    });

    it('should throw error when submission not found', async () => {
      mockSubmissionRepository.findById.mockResolvedValue(null);

      await expect(
        submissionService.updateSubmissionStatus('invalid-id', 'completed')
      ).rejects.toThrow('Submission not found');
    });
  });

  describe('updateSubmissionVerdict', () => {
    it('should update submission verdict successfully', async () => {
      const mockSubmission = {
        id: 'sub-123',
        verdict: null,
      };

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);
      mockSubmissionRepository.save.mockResolvedValue(true);

      const result = await submissionService.updateSubmissionVerdict('sub-123', 'accepted');

      expect(result.verdict).toBe('accepted');
    });

    it('should throw error for invalid verdict', async () => {
      const mockSubmission = {
        id: 'sub-123',
        verdict: null,
      };

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);

      await expect(
        submissionService.updateSubmissionVerdict('sub-123', 'invalid_verdict')
      ).rejects.toThrow('Invalid verdict');
    });

    it('should accept all valid verdicts', async () => {
      const mockSubmission = {
        id: 'sub-123',
        verdict: null,
      };

      const validVerdicts = [
        'accepted',
        'wrong_answer',
        'time_limit',
        'memory_limit',
        'compilation_error',
        'runtime_error',
      ];

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);
      mockSubmissionRepository.save.mockResolvedValue(true);

      for (const verdict of validVerdicts) {
        const result = await submissionService.updateSubmissionVerdict('sub-123', verdict);
        expect(result.verdict).toBe(verdict);
      }
    });
  });

  describe('getSubmissionsByStudent', () => {
    it('should retrieve all submissions by student', async () => {
      const mockSubmissions = [
        { id: 'sub-1', status: 'completed' },
        { id: 'sub-2', status: 'completed' },
        { id: 'sub-3', status: 'pending' },
      ];

      mockSubmissionRepository.findByStudent.mockResolvedValue(mockSubmissions);

      const result = await submissionService.getSubmissionsByStudent('student-123');

      expect(result).toHaveLength(3);
    });

    it('should limit results when limit parameter is provided', async () => {
      const mockSubmissions = [
        { id: 'sub-1', status: 'completed' },
        { id: 'sub-2', status: 'completed' },
        { id: 'sub-3', status: 'pending' },
        { id: 'sub-4', status: 'failed' },
      ];

      mockSubmissionRepository.findByStudent.mockResolvedValue(mockSubmissions);

      const result = await submissionService.getSubmissionsByStudent('student-123', 2);

      expect(result).toHaveLength(2);
    });

    it('should return empty array when student has no submissions', async () => {
      mockSubmissionRepository.findByStudent.mockResolvedValue(null);

      const result = await submissionService.getSubmissionsByStudent('student-999');

      expect(result).toEqual([]);
    });
  });

  describe('getSubmissionsByQuestion', () => {
    it('should retrieve all submissions for a question', async () => {
      const mockSubmissions = [
        { id: 'sub-1', studentId: 'student-1' },
        { id: 'sub-2', studentId: 'student-2' },
      ];

      mockSubmissionRepository.findByQuestion.mockResolvedValue(mockSubmissions);

      const result = await submissionService.getSubmissionsByQuestion('question-123');

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no submissions for question', async () => {
      mockSubmissionRepository.findByQuestion.mockResolvedValue(null);

      const result = await submissionService.getSubmissionsByQuestion('question-999');

      expect(result).toEqual([]);
    });
  });

  describe('getLatestSubmission', () => {
    it('should retrieve latest submission for student and question', async () => {
      const mockSubmission = {
        id: 'sub-123',
        studentId: 'student-123',
        questionId: 'question-123',
      };

      mockSubmissionRepository.findLatest.mockResolvedValue(mockSubmission);

      const result = await submissionService.getLatestSubmission('student-123', 'question-123');

      expect(result.id).toBe('sub-123');
    });

    it('should throw error when no submission found', async () => {
      mockSubmissionRepository.findLatest.mockResolvedValue(null);

      await expect(
        submissionService.getLatestSubmission('student-999', 'question-999')
      ).rejects.toThrow('No submission found');
    });
  });

  describe('countSubmissionsByStatus', () => {
    it('should count submissions by status', async () => {
      const mockSubmissions = [
        { id: 'sub-1', status: 'pending' },
        { id: 'sub-2', status: 'pending' },
        { id: 'sub-3', status: 'running' },
        { id: 'sub-4', status: 'completed' },
        { id: 'sub-5', status: 'failed' },
      ];

      mockSubmissionRepository.findByStudent.mockResolvedValue(mockSubmissions);

      const result = await submissionService.countSubmissionsByStatus('student-123');

      expect(result.pending).toBe(2);
      expect(result.running).toBe(1);
      expect(result.completed).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('should return zero counts when student has no submissions', async () => {
      mockSubmissionRepository.findByStudent.mockResolvedValue(null);

      const result = await submissionService.countSubmissionsByStatus('student-999');

      expect(result.pending).toBe(0);
      expect(result.running).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('deleteSubmission', () => {
    it('should delete submission and its results successfully', async () => {
      const mockSubmission = {
        id: 'sub-123',
        studentId: 'student-123',
      };

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);
      mockSubmissionResultRepository.deleteBySubmission.mockResolvedValue(true);
      mockSubmissionRepository.delete.mockResolvedValue(true);

      const result = await submissionService.deleteSubmission('sub-123');

      expect(result).toBe(true);
      expect(mockSubmissionResultRepository.deleteBySubmission).toHaveBeenCalledWith('sub-123');
      expect(mockSubmissionRepository.delete).toHaveBeenCalledWith('sub-123');
    });

    it('should throw error when submission not found', async () => {
      mockSubmissionRepository.findById.mockResolvedValue(null);

      await expect(submissionService.deleteSubmission('invalid-id')).rejects.toThrow(
        'Submission not found'
      );
    });
  });

  describe('getAcceptedCount', () => {
    it('should count accepted submissions', async () => {
      const mockSubmissions = [
        { id: 'sub-1', verdict: 'accepted' },
        { id: 'sub-2', verdict: 'accepted' },
        { id: 'sub-3', verdict: 'wrong_answer' },
        { id: 'sub-4', verdict: 'accepted' },
      ];

      mockSubmissionRepository.findByStudent.mockResolvedValue(mockSubmissions);

      const result = await submissionService.getAcceptedCount('student-123');

      expect(result).toBe(3);
    });

    it('should return 0 when no accepted submissions', async () => {
      const mockSubmissions = [
        { id: 'sub-1', verdict: 'wrong_answer' },
        { id: 'sub-2', verdict: 'time_limit' },
      ];

      mockSubmissionRepository.findByStudent.mockResolvedValue(mockSubmissions);

      const result = await submissionService.getAcceptedCount('student-123');

      expect(result).toBe(0);
    });

    it('should return 0 when student has no submissions', async () => {
      mockSubmissionRepository.findByStudent.mockResolvedValue(null);

      const result = await submissionService.getAcceptedCount('student-999');

      expect(result).toBe(0);
    });
  });

  describe('getSubmissionLanguage', () => {
    it('should retrieve submission programming language', async () => {
      const mockSubmission = {
        id: 'sub-123',
        language: 'python',
      };

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);

      const result = await submissionService.getSubmissionLanguage('sub-123');

      expect(result).toBe('python');
    });

    it('should return unknown when language not set', async () => {
      const mockSubmission = {
        id: 'sub-123',
      };

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);

      const result = await submissionService.getSubmissionLanguage('sub-123');

      expect(result).toBe('unknown');
    });

    it('should throw error when submission not found', async () => {
      mockSubmissionRepository.findById.mockResolvedValue(null);

      await expect(submissionService.getSubmissionLanguage('invalid-id')).rejects.toThrow(
        'Submission not found'
      );
    });
  });
});
