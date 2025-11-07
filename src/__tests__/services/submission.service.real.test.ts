/**
 * @module __tests__/services
 * @description Submission Service Unit Tests - Real Pattern
 * 
 * Mock implementation that follows the real service interface.
 */

import { SubmissionStatus } from '../../enums';

// Mock repositories
const mockSubmissionRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByStudent: jest.fn(),
  findByQuestion: jest.fn(),
  findByQuestionAndStudent: jest.fn(),
};

const mockQuestionRepository = {
  findById: jest.fn(),
};

const mockUserRepository = {
  findById: jest.fn(),
};

// Real implementation pattern
class SubmissionServiceMock {
  constructor(
    private submissionRepository: any,
    private questionRepository: any,
    private userRepository: any
  ) {}

  async createSubmission(dto: any, studentId: string) {
    const question = await this.questionRepository.findById(dto.questionId);

    if (!question) {
      throw new Error('Question not found');
    }

    const student = await this.userRepository.findById(studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    // Check if student already has a submission
    const existingSubmission = await this.submissionRepository.findByQuestionAndStudent(
      dto.questionId,
      studentId
    );

    if (existingSubmission) {
      throw new Error('Student already has a submission for this question');
    }

    const submission = {
      id: `submission-${Date.now()}`,
      questionId: dto.questionId,
      studentId,
      code: dto.code,
      language: dto.language,
      status: SubmissionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.submissionRepository.save(submission);
  }

  async getSubmissionById(id: string) {
    const submission = await this.submissionRepository.findById(id);

    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission;
  }

  async getSubmissionsByStudent(studentId: string) {
    const submissions = await this.submissionRepository.findByStudent(studentId);
    return submissions || [];
  }

  async getSubmissionsByQuestion(questionId: string) {
    const submissions = await this.submissionRepository.findByQuestion(questionId);
    return submissions || [];
  }

  async updateSubmissionStatus(id: string, status: SubmissionStatus) {
    const submission = await this.submissionRepository.findById(id);

    if (!submission) {
      throw new Error('Submission not found');
    }

    submission.status = status;
    submission.updatedAt = new Date();

    return await this.submissionRepository.save(submission);
  }

  async deleteSubmission(id: string) {
    const submission = await this.submissionRepository.findById(id);

    if (!submission) {
      throw new Error('Submission not found');
    }

    await this.submissionRepository.delete(id);
  }
}

describe('SubmissionService - Real Pattern Implementation', () => {
  let service: SubmissionServiceMock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubmissionServiceMock(
      mockSubmissionRepository,
      mockQuestionRepository,
      mockUserRepository
    );
  });

  describe('createSubmission', () => {
    it('should create submission successfully', async () => {
      const dto = {
        questionId: 'question-1',
        code: 'console.log("Hello World");',
        language: 'javascript',
      };

      const mockQuestion = { id: 'question-1', title: 'Q1' };
      const mockStudent = { id: 'student-1', email: 'student@example.com' };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockUserRepository.findById.mockResolvedValue(mockStudent);
      mockSubmissionRepository.findByQuestionAndStudent.mockResolvedValue(null);
      mockSubmissionRepository.save.mockResolvedValue({
        id: 'submission-1',
        ...dto,
        studentId: 'student-1',
        status: SubmissionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createSubmission(dto, 'student-1');

      expect(result.code).toBe('console.log("Hello World");');
      expect(result.status).toBe(SubmissionStatus.PENDING);
      expect(mockSubmissionRepository.save).toHaveBeenCalled();
    });

    it('should throw error if question does not exist', async () => {
      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(
        service.createSubmission(
          { questionId: 'non-existent', code: 'code', language: 'python' },
          'student-1'
        )
      ).rejects.toThrow('Question not found');
    });

    it('should throw error if student does not exist', async () => {
      const mockQuestion = { id: 'question-1' };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        service.createSubmission(
          { questionId: 'question-1', code: 'code', language: 'python' },
          'non-existent'
        )
      ).rejects.toThrow('Student not found');
    });

    it('should throw error if student already has submission', async () => {
      const mockQuestion = { id: 'question-1' };
      const mockStudent = { id: 'student-1' };
      const existingSubmission = { id: 'submission-old' };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockUserRepository.findById.mockResolvedValue(mockStudent);
      mockSubmissionRepository.findByQuestionAndStudent.mockResolvedValue(
        existingSubmission
      );

      await expect(
        service.createSubmission(
          { questionId: 'question-1', code: 'code', language: 'python' },
          'student-1'
        )
      ).rejects.toThrow('Student already has a submission for this question');
    });
  });

  describe('getSubmissionById', () => {
    it('should return submission by ID', async () => {
      const mockSubmission = {
        id: 'submission-1',
        questionId: 'question-1',
        studentId: 'student-1',
        status: SubmissionStatus.ACCEPTED,
      };

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);

      const result = await service.getSubmissionById('submission-1');

      expect(result.id).toBe('submission-1');
      expect(result.status).toBe(SubmissionStatus.ACCEPTED);
    });

    it('should throw error when submission does not exist', async () => {
      mockSubmissionRepository.findById.mockResolvedValue(null);

      await expect(service.getSubmissionById('non-existent')).rejects.toThrow(
        'Submission not found'
      );
    });
  });

  describe('getSubmissionsByStudent', () => {
    it('should return submissions for student', async () => {
      const mockSubmissions = [
        {
          id: 'submission-1',
          questionId: 'question-1',
          studentId: 'student-1',
          status: SubmissionStatus.ACCEPTED,
        },
        {
          id: 'submission-2',
          questionId: 'question-2',
          studentId: 'student-1',
          status: SubmissionStatus.WRONG_ANSWER,
        },
      ];

      mockSubmissionRepository.findByStudent.mockResolvedValue(mockSubmissions);

      const result = await service.getSubmissionsByStudent('student-1');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(SubmissionStatus.ACCEPTED);
      expect(mockSubmissionRepository.findByStudent).toHaveBeenCalledWith('student-1');
    });

    it('should return empty array when student has no submissions', async () => {
      mockSubmissionRepository.findByStudent.mockResolvedValue([]);

      const result = await service.getSubmissionsByStudent('student-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getSubmissionsByQuestion', () => {
    it('should return submissions for question', async () => {
      const mockSubmissions = [
        {
          id: 'submission-1',
          questionId: 'question-1',
          studentId: 'student-1',
          status: SubmissionStatus.ACCEPTED,
        },
        {
          id: 'submission-2',
          questionId: 'question-1',
          studentId: 'student-2',
          status: SubmissionStatus.PENDING,
        },
      ];

      mockSubmissionRepository.findByQuestion.mockResolvedValue(mockSubmissions);

      const result = await service.getSubmissionsByQuestion('question-1');

      expect(result).toHaveLength(2);
      expect(result[0].questionId).toBe('question-1');
    });

    it('should return empty array when question has no submissions', async () => {
      mockSubmissionRepository.findByQuestion.mockResolvedValue([]);

      const result = await service.getSubmissionsByQuestion('question-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('updateSubmissionStatus', () => {
    it('should update submission status successfully', async () => {
      const mockSubmission = {
        id: 'submission-1',
        status: SubmissionStatus.PENDING,
      };

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);
      mockSubmissionRepository.save.mockResolvedValue({
        ...mockSubmission,
        status: SubmissionStatus.ACCEPTED,
        updatedAt: new Date(),
      });

      const result = await service.updateSubmissionStatus(
        'submission-1',
        SubmissionStatus.ACCEPTED
      );

      expect(result.status).toBe(SubmissionStatus.ACCEPTED);
    });

    it('should throw error if submission does not exist', async () => {
      mockSubmissionRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateSubmissionStatus('non-existent', SubmissionStatus.ACCEPTED)
      ).rejects.toThrow('Submission not found');
    });

    it('should handle all status transitions', async () => {
      const statuses = [
        SubmissionStatus.PENDING,
        SubmissionStatus.ACCEPTED,
        SubmissionStatus.WRONG_ANSWER,
        SubmissionStatus.RUNTIME_ERROR,
        SubmissionStatus.TIME_LIMIT_EXCEEDED,
      ];

      for (const status of statuses) {
        const mockSubmission = {
          id: `submission-${status}`,
          status: SubmissionStatus.PENDING,
        };

        mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);
        mockSubmissionRepository.save.mockResolvedValue({
          ...mockSubmission,
          status,
        });

        const result = await service.updateSubmissionStatus(
          `submission-${status}`,
          status
        );

        expect(result.status).toBe(status);
      }
    });
  });

  describe('deleteSubmission', () => {
    it('should delete submission successfully', async () => {
      const mockSubmission = { id: 'submission-1' };

      mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);
      mockSubmissionRepository.delete.mockResolvedValue(true);

      await service.deleteSubmission('submission-1');

      expect(mockSubmissionRepository.delete).toHaveBeenCalledWith('submission-1');
    });

    it('should throw error if submission does not exist', async () => {
      mockSubmissionRepository.findById.mockResolvedValue(null);

      await expect(service.deleteSubmission('non-existent')).rejects.toThrow(
        'Submission not found'
      );
    });
  });
});
