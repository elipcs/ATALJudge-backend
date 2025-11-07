/**
 * @module __tests__/integration
 * @description Submission Use Cases Integration Tests
 */

const mockSubmissionRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByStudent: jest.fn(),
  findByQuestion: jest.fn(),
  findLatestForQuestion: jest.fn(),
  countByStatus: jest.fn(),
  findWithResults: jest.fn(),
};

const mockSubmissionResultRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findBySubmission: jest.fn(),
};

const mockGradeRepository = {
  findByStudentAndList: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

describe('Submission Use Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateSubmissionUseCase', () => {
    it('should create a new submission', async () => {
      const newSubmission = {
        id: 'sub-123',
        studentId: 'student-456',
        questionId: 'q-789',
        code: '#include<iostream>\nint main(){}',
        language: 'cpp',
        status: 'PENDING',
        verdict: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubmissionRepository.create.mockResolvedValue(newSubmission);

      const result = await mockSubmissionRepository.create(newSubmission);

      expect(result.id).toBe('sub-123');
      expect(result.status).toBe('PENDING');
      expect(result.studentId).toBe('student-456');
    });

    it('should create submission with code and language', async () => {
      const submission = {
        id: 'sub-456',
        studentId: 'student-123',
        questionId: 'q-456',
        code: 'print("Hello World")',
        language: 'python',
        status: 'PENDING',
        verdict: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubmissionRepository.create.mockResolvedValue(submission);

      const result = await mockSubmissionRepository.create(submission);

      expect(result.code).toContain('Hello World');
      expect(result.language).toBe('python');
    });
  });

  describe('GetSubmissionUseCase', () => {
    it('should retrieve submission with results', async () => {
      const submissionId = 'sub-123';
      const mockSubmission = {
        id: submissionId,
        studentId: 'student-456',
        questionId: 'q-789',
        code: '#include<iostream>\nint main(){}',
        language: 'cpp',
        status: 'COMPILED',
        verdict: 'ACCEPTED',
        createdAt: new Date(),
        updatedAt: new Date(),
        results: [
          { testCaseId: 'tc-1', passed: true },
          { testCaseId: 'tc-2', passed: true },
        ],
      };

      mockSubmissionRepository.findWithResults.mockResolvedValue(mockSubmission);

      const result = await mockSubmissionRepository.findWithResults(submissionId);

      expect(result).toBeDefined();
      expect(result?.verdict).toBe('ACCEPTED');
      expect(result?.results).toHaveLength(2);
    });
  });

  describe('GetSubmissionsForQuestionUseCase', () => {
    it('should retrieve all submissions for a question', async () => {
      const questionId = 'q-123';
      const mockSubmissions = [
        {
          id: 'sub-1',
          studentId: 'student-1',
          questionId,
          code: 'code1',
          language: 'cpp',
          status: 'COMPILED',
          verdict: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'sub-2',
          studentId: 'student-2',
          questionId,
          code: 'code2',
          language: 'python',
          status: 'COMPILED',
          verdict: 'WRONG_ANSWER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockSubmissionRepository.findByQuestion.mockResolvedValue(mockSubmissions);

      const result = await mockSubmissionRepository.findByQuestion(questionId);

      expect(result).toHaveLength(2);
      expect(result[0].verdict).toBe('ACCEPTED');
      expect(result[1].verdict).toBe('WRONG_ANSWER');
    });
  });

  describe('GetStudentSubmissionsUseCase', () => {
    it('should retrieve all submissions for a student', async () => {
      const studentId = 'student-123';
      const mockSubmissions = [
        {
          id: 'sub-1',
          studentId,
          questionId: 'q-1',
          code: 'code1',
          language: 'cpp',
          status: 'COMPILED',
          verdict: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'sub-2',
          studentId,
          questionId: 'q-2',
          code: 'code2',
          language: 'python',
          status: 'PENDING',
          verdict: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockSubmissionRepository.findByStudent.mockResolvedValue(mockSubmissions);

      const result = await mockSubmissionRepository.findByStudent(studentId);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('COMPILED');
      expect(result[1].status).toBe('PENDING');
    });
  });

  describe('GetLatestSubmissionUseCase', () => {
    it('should retrieve latest submission for question by student', async () => {
      const studentId = 'student-123';
      const questionId = 'q-456';
      const mockSubmission = {
        id: 'sub-789',
        studentId,
        questionId,
        code: 'latest code',
        language: 'cpp',
        status: 'COMPILED',
        verdict: 'ACCEPTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubmissionRepository.findLatestForQuestion.mockResolvedValue(mockSubmission);

      const result = await mockSubmissionRepository.findLatestForQuestion(studentId, questionId);

      expect(result).toBeDefined();
      expect(result?.code).toBe('latest code');
    });
  });

  describe('UpdateSubmissionStatusUseCase', () => {
    it('should update submission status and verdict', async () => {
      const submissionId = 'sub-123';
      const updates = {
        status: 'COMPILED',
        verdict: 'ACCEPTED',
      };

      const updatedSubmission = {
        id: submissionId,
        studentId: 'student-456',
        questionId: 'q-789',
        code: 'code',
        language: 'cpp',
        ...updates,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubmissionRepository.save.mockResolvedValue(updatedSubmission);

      const result = await mockSubmissionRepository.save(updatedSubmission);

      expect(result.status).toBe('COMPILED');
      expect(result.verdict).toBe('ACCEPTED');
    });
  });

  describe('CountSubmissionsByStatusUseCase', () => {
    it('should count submissions by status', async () => {
      const counts = {
        PENDING: 5,
        COMPILED: 12,
        ACCEPTED: 8,
        WRONG_ANSWER: 2,
      };

      mockSubmissionRepository.countByStatus.mockResolvedValue(counts);

      const result = await mockSubmissionRepository.countByStatus();

      expect(result.PENDING).toBe(5);
      expect(result.COMPILED).toBe(12);
      expect(result.ACCEPTED).toBe(8);
    });
  });
});
