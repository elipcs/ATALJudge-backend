/**
 * @module __tests__/services
 * @description Grade Service Unit Tests
 */

class GradeServiceDemo {
  constructor(
    private gradeRepository: any,
    private submissionRepository: any,
    private questionRepository: any
  ) {}

  async calculateGrade(studentId: string, listId: string) {
    const submissions = await this.submissionRepository.findByStudentAndList(studentId, listId);
    if (!submissions || submissions.length === 0) {
      throw new Error('No submissions found for this list');
    }

    const acceptedCount = submissions.filter((s: any) => s.verdict === 'accepted').length;
    const totalCount = submissions.length;
    const percentage = (acceptedCount / totalCount) * 100;

    return {
      percentage: Math.round(percentage),
      acceptedCount,
      totalCount,
    };
  }

  async getGradeById(id: string) {
    const grade = await this.gradeRepository.findById(id);
    if (!grade) throw new Error('Grade not found');
    return grade;
  }

  async getStudentGrades(studentId: string) {
    const grades = await this.gradeRepository.findByStudent(studentId);
    return grades || [];
  }

  async getGradeByStudentAndList(studentId: string, listId: string) {
    const grade = await this.gradeRepository.findByStudentAndList(studentId, listId);
    if (!grade) throw new Error('Grade not found');
    return grade;
  }

  async getListGrades(listId: string) {
    const grades = await this.gradeRepository.findByList(listId);
    return grades || [];
  }

  async calculateStudentAverage(studentId: string) {
    const grades = await this.gradeRepository.findByStudent(studentId);
    if (!grades || grades.length === 0) throw new Error('No grades found');

    const average = grades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0) / grades.length;
    return Math.round(average);
  }

  async saveGrade(data: any) {
    if (!data.studentId || !data.listId) {
      throw new Error('Student ID and List ID are required');
    }

    const newGrade = {
      id: `grade-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.gradeRepository.save(newGrade);
    return newGrade;
  }

  async updateGrade(id: string, data: any) {
    const grade = await this.gradeRepository.findById(id);
    if (!grade) throw new Error('Grade not found');

    const updated = { ...grade, ...data, updatedAt: new Date() };
    await this.gradeRepository.save(updated);
    return updated;
  }

  async deleteGrade(id: string) {
    const grade = await this.gradeRepository.findById(id);
    if (!grade) throw new Error('Grade not found');

    await this.gradeRepository.delete(id);
    return true;
  }

  async getTopStudents(listId: string, limit: number = 10) {
    const grades = await this.gradeRepository.findByList(listId);
    if (!grades) return [];

    return grades
      .sort((a: any, b: any) => (b.percentage || 0) - (a.percentage || 0))
      .slice(0, limit);
  }

  async getGradesByRange(listId: string, minPercentage: number, maxPercentage: number) {
    const grades = await this.gradeRepository.findByList(listId);
    if (!grades) return [];

    return grades.filter(
      (g: any) => (g.percentage || 0) >= minPercentage && (g.percentage || 0) <= maxPercentage
    );
  }
}

describe('GradeService', () => {
  let gradeService: any;
  let mockGradeRepository: any;
  let mockSubmissionRepository: any;
  let mockQuestionRepository: any;

  beforeEach(() => {
    mockGradeRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByStudent: jest.fn(),
      findByStudentAndList: jest.fn(),
      findByList: jest.fn(),
    };

    mockSubmissionRepository = {
      findByStudentAndList: jest.fn(),
    };

    mockQuestionRepository = {
      findById: jest.fn(),
    };

    gradeService = new GradeServiceDemo(
      mockGradeRepository,
      mockSubmissionRepository,
      mockQuestionRepository
    );
    jest.clearAllMocks();
  });

  describe('calculateGrade', () => {
    it('should calculate grade as 100% when all submissions accepted', async () => {
      const mockSubmissions = [
        { id: 's-1', verdict: 'accepted' },
        { id: 's-2', verdict: 'accepted' },
        { id: 's-3', verdict: 'accepted' },
      ];

      mockSubmissionRepository.findByStudentAndList.mockResolvedValue(mockSubmissions);

      const result = await gradeService.calculateGrade('student-123', 'list-123');

      expect(result.percentage).toBe(100);
      expect(result.acceptedCount).toBe(3);
      expect(result.totalCount).toBe(3);
    });

    it('should calculate grade as 50% when half submissions accepted', async () => {
      const mockSubmissions = [
        { id: 's-1', verdict: 'accepted' },
        { id: 's-2', verdict: 'wrong_answer' },
      ];

      mockSubmissionRepository.findByStudentAndList.mockResolvedValue(mockSubmissions);

      const result = await gradeService.calculateGrade('student-123', 'list-123');

      expect(result.percentage).toBe(50);
      expect(result.acceptedCount).toBe(1);
      expect(result.totalCount).toBe(2);
    });

    it('should calculate grade as 0% when no submissions accepted', async () => {
      const mockSubmissions = [
        { id: 's-1', verdict: 'wrong_answer' },
        { id: 's-2', verdict: 'wrong_answer' },
      ];

      mockSubmissionRepository.findByStudentAndList.mockResolvedValue(mockSubmissions);

      const result = await gradeService.calculateGrade('student-123', 'list-123');

      expect(result.percentage).toBe(0);
      expect(result.acceptedCount).toBe(0);
    });

    it('should throw error when no submissions found', async () => {
      mockSubmissionRepository.findByStudentAndList.mockResolvedValue(null);

      await expect(
        gradeService.calculateGrade('student-123', 'list-123')
      ).rejects.toThrow('No submissions found for this list');
    });
  });

  describe('getGradeById', () => {
    it('should retrieve grade by id', async () => {
      const mockGrade = {
        id: 'grade-123',
        studentId: 'student-123',
        listId: 'list-123',
        percentage: 85,
      };

      mockGradeRepository.findById.mockResolvedValue(mockGrade);

      const result = await gradeService.getGradeById('grade-123');

      expect(result.id).toBe('grade-123');
      expect(result.percentage).toBe(85);
    });

    it('should throw error when grade not found', async () => {
      mockGradeRepository.findById.mockResolvedValue(null);

      await expect(gradeService.getGradeById('invalid-id')).rejects.toThrow(
        'Grade not found'
      );
    });
  });

  describe('getStudentGrades', () => {
    it('should retrieve all grades for a student', async () => {
      const mockGrades = [
        { id: 'g-1', listId: 'list-1', percentage: 90 },
        { id: 'g-2', listId: 'list-2', percentage: 85 },
        { id: 'g-3', listId: 'list-3', percentage: 92 },
      ];

      mockGradeRepository.findByStudent.mockResolvedValue(mockGrades);

      const result = await gradeService.getStudentGrades('student-123');

      expect(result).toHaveLength(3);
      expect(result[0].percentage).toBe(90);
    });

    it('should return empty array when student has no grades', async () => {
      mockGradeRepository.findByStudent.mockResolvedValue(null);

      const result = await gradeService.getStudentGrades('student-999');

      expect(result).toEqual([]);
    });
  });

  describe('getGradeByStudentAndList', () => {
    it('should retrieve specific grade for student and list', async () => {
      const mockGrade = {
        id: 'grade-123',
        studentId: 'student-123',
        listId: 'list-123',
        percentage: 88,
      };

      mockGradeRepository.findByStudentAndList.mockResolvedValue(mockGrade);

      const result = await gradeService.getGradeByStudentAndList(
        'student-123',
        'list-123'
      );

      expect(result.percentage).toBe(88);
    });

    it('should throw error when grade not found', async () => {
      mockGradeRepository.findByStudentAndList.mockResolvedValue(null);

      await expect(
        gradeService.getGradeByStudentAndList('student-123', 'list-123')
      ).rejects.toThrow('Grade not found');
    });
  });

  describe('getListGrades', () => {
    it('should retrieve all grades for a list', async () => {
      const mockGrades = [
        { id: 'g-1', studentId: 'student-1', percentage: 90 },
        { id: 'g-2', studentId: 'student-2', percentage: 85 },
        { id: 'g-3', studentId: 'student-3', percentage: 92 },
      ];

      mockGradeRepository.findByList.mockResolvedValue(mockGrades);

      const result = await gradeService.getListGrades('list-123');

      expect(result).toHaveLength(3);
    });

    it('should return empty array when list has no grades', async () => {
      mockGradeRepository.findByList.mockResolvedValue(null);

      const result = await gradeService.getListGrades('list-999');

      expect(result).toEqual([]);
    });
  });

  describe('calculateStudentAverage', () => {
    it('should calculate correct average of student grades', async () => {
      const mockGrades = [
        { id: 'g-1', percentage: 80 },
        { id: 'g-2', percentage: 90 },
        { id: 'g-3', percentage: 100 },
      ];

      mockGradeRepository.findByStudent.mockResolvedValue(mockGrades);

      const result = await gradeService.calculateStudentAverage('student-123');

      expect(result).toBe(90);
    });

    it('should throw error when student has no grades', async () => {
      mockGradeRepository.findByStudent.mockResolvedValue(null);

      await expect(
        gradeService.calculateStudentAverage('student-999')
      ).rejects.toThrow('No grades found');
    });

    it('should round average correctly', async () => {
      const mockGrades = [
        { id: 'g-1', percentage: 85 },
        { id: 'g-2', percentage: 87 },
      ];

      mockGradeRepository.findByStudent.mockResolvedValue(mockGrades);

      const result = await gradeService.calculateStudentAverage('student-123');

      expect(result).toBe(86);
    });
  });

  describe('saveGrade', () => {
    it('should save new grade successfully', async () => {
      const gradeData = {
        studentId: 'student-123',
        listId: 'list-123',
        percentage: 85,
      };

      mockGradeRepository.save.mockResolvedValue(true);

      const result = await gradeService.saveGrade(gradeData);

      expect(result.studentId).toBe('student-123');
      expect(result.listId).toBe('list-123');
      expect(result.createdAt).toBeDefined();
      expect(mockGradeRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when student ID is missing', async () => {
      const gradeData = {
        listId: 'list-123',
      };

      await expect(gradeService.saveGrade(gradeData)).rejects.toThrow(
        'Student ID and List ID are required'
      );
    });

    it('should throw error when list ID is missing', async () => {
      const gradeData = {
        studentId: 'student-123',
      };

      await expect(gradeService.saveGrade(gradeData)).rejects.toThrow(
        'Student ID and List ID are required'
      );
    });
  });

  describe('updateGrade', () => {
    it('should update grade successfully', async () => {
      const existingGrade = {
        id: 'grade-123',
        studentId: 'student-123',
        percentage: 80,
      };

      mockGradeRepository.findById.mockResolvedValue(existingGrade);
      mockGradeRepository.save.mockResolvedValue(true);

      const result = await gradeService.updateGrade('grade-123', {
        percentage: 90,
      });

      expect(result.percentage).toBe(90);
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error when grade not found', async () => {
      mockGradeRepository.findById.mockResolvedValue(null);

      await expect(
        gradeService.updateGrade('invalid-id', { percentage: 90 })
      ).rejects.toThrow('Grade not found');
    });
  });

  describe('deleteGrade', () => {
    it('should delete grade successfully', async () => {
      const mockGrade = {
        id: 'grade-123',
        studentId: 'student-123',
      };

      mockGradeRepository.findById.mockResolvedValue(mockGrade);
      mockGradeRepository.delete.mockResolvedValue(true);

      const result = await gradeService.deleteGrade('grade-123');

      expect(result).toBe(true);
      expect(mockGradeRepository.delete).toHaveBeenCalledWith('grade-123');
    });

    it('should throw error when grade not found', async () => {
      mockGradeRepository.findById.mockResolvedValue(null);

      await expect(gradeService.deleteGrade('invalid-id')).rejects.toThrow(
        'Grade not found'
      );
    });
  });

  describe('getTopStudents', () => {
    it('should retrieve top students sorted by grade', async () => {
      const mockGrades = [
        { id: 'g-1', studentId: 'student-1', percentage: 75 },
        { id: 'g-2', studentId: 'student-2', percentage: 95 },
        { id: 'g-3', studentId: 'student-3', percentage: 85 },
      ];

      mockGradeRepository.findByList.mockResolvedValue(mockGrades);

      const result = await gradeService.getTopStudents('list-123', 3);

      expect(result[0].percentage).toBe(95);
      expect(result[1].percentage).toBe(85);
      expect(result[2].percentage).toBe(75);
    });

    it('should limit results to specified number', async () => {
      const mockGrades = [
        { id: 'g-1', percentage: 95 },
        { id: 'g-2', percentage: 90 },
        { id: 'g-3', percentage: 85 },
        { id: 'g-4', percentage: 80 },
      ];

      mockGradeRepository.findByList.mockResolvedValue(mockGrades);

      const result = await gradeService.getTopStudents('list-123', 2);

      expect(result).toHaveLength(2);
      expect(result[0].percentage).toBe(95);
    });

    it('should return empty array when list has no grades', async () => {
      mockGradeRepository.findByList.mockResolvedValue(null);

      const result = await gradeService.getTopStudents('list-999');

      expect(result).toEqual([]);
    });
  });

  describe('getGradesByRange', () => {
    it('should filter grades by percentage range', async () => {
      const mockGrades = [
        { id: 'g-1', percentage: 65 },
        { id: 'g-2', percentage: 85 },
        { id: 'g-3', percentage: 95 },
        { id: 'g-4', percentage: 45 },
      ];

      mockGradeRepository.findByList.mockResolvedValue(mockGrades);

      const result = await gradeService.getGradesByRange('list-123', 80, 100);

      expect(result).toHaveLength(2);
      expect(result[0].percentage).toBe(85);
      expect(result[1].percentage).toBe(95);
    });

    it('should return empty array when no grades in range', async () => {
      const mockGrades = [
        { id: 'g-1', percentage: 65 },
        { id: 'g-2', percentage: 45 },
      ];

      mockGradeRepository.findByList.mockResolvedValue(mockGrades);

      const result = await gradeService.getGradesByRange('list-123', 80, 100);

      expect(result).toHaveLength(0);
    });

    it('should return empty array when list has no grades', async () => {
      mockGradeRepository.findByList.mockResolvedValue(null);

      const result = await gradeService.getGradesByRange('list-999', 80, 100);

      expect(result).toEqual([]);
    });
  });
});
