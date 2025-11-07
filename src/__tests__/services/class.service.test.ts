/**
 * @module __tests__/services
 * @description Class Service Unit Tests
 */

class ClassServiceDemo {
  constructor(
    private classRepository: any,
    private studentRepository: any
  ) {}

  async createClass(data: any) {
    if (!data.name || !data.professorId) {
      throw new Error('Missing required fields');
    }

    const newClass = {
      id: `class-${Date.now()}`,
      ...data,
      students: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.classRepository.save(newClass);
    return newClass;
  }

  async getClassById(id: string) {
    const classData = await this.classRepository.findById(id);
    if (!classData) throw new Error('Class not found');
    return classData;
  }

  async updateClass(id: string, data: any) {
    const classData = await this.classRepository.findById(id);
    if (!classData) throw new Error('Class not found');

    const updated = { ...classData, ...data, updatedAt: new Date() };
    await this.classRepository.save(updated);
    return updated;
  }

  async deleteClass(id: string) {
    const classData = await this.classRepository.findById(id);
    if (!classData) throw new Error('Class not found');

    await this.classRepository.delete(id);
    return true;
  }

  async addStudentToClass(classId: string, studentId: string) {
    const classData = await this.classRepository.findById(classId);
    if (!classData) throw new Error('Class not found');

    const student = await this.studentRepository.findById(studentId);
    if (!student) throw new Error('Student not found');

    if (classData.students?.includes(studentId)) {
      throw new Error('Student already in class');
    }

    classData.students = [...(classData.students || []), studentId];
    await this.classRepository.save(classData);
    return classData;
  }

  async removeStudentFromClass(classId: string, studentId: string) {
    const classData = await this.classRepository.findById(classId);
    if (!classData) throw new Error('Class not found');

    classData.students = classData.students?.filter((id: string) => id !== studentId) || [];
    await this.classRepository.save(classData);
    return classData;
  }

  async getClassesByProfessor(professorId: string) {
    const classes = await this.classRepository.findByProfessor(professorId);
    return classes || [];
  }

  async getClassStudents(classId: string) {
    const classData = await this.classRepository.findById(classId);
    if (!classData) throw new Error('Class not found');

    const students = await this.studentRepository.findByIds(classData.students || []);
    return students;
  }

  async getClassCount(professorId: string) {
    const classes = await this.classRepository.findByProfessor(professorId);
    return classes?.length || 0;
  }

  async checkStudentInClass(classId: string, studentId: string) {
    const classData = await this.classRepository.findById(classId);
    if (!classData) throw new Error('Class not found');

    return classData.students?.includes(studentId) || false;
  }
}

describe('ClassService', () => {
  let classService: any;
  let mockClassRepository: any;
  let mockStudentRepository: any;

  beforeEach(() => {
    mockClassRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByProfessor: jest.fn(),
      findByIds: jest.fn(),
    };

    mockStudentRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    classService = new ClassServiceDemo(mockClassRepository, mockStudentRepository);
    jest.clearAllMocks();
  });

  describe('createClass', () => {
    it('should create a new class successfully', async () => {
      const classData = {
        name: 'Math 101',
        description: 'Basic Mathematics',
        professorId: 'prof-123',
        maxStudents: 30,
      };

      mockClassRepository.save.mockResolvedValue(true);

      const result = await classService.createClass(classData);

      expect(result.name).toBe('Math 101');
      expect(result.professorId).toBe('prof-123');
      expect(result.students).toEqual([]);
      expect(mockClassRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when name is missing', async () => {
      const classData = {
        professorId: 'prof-123',
      };

      await expect(classService.createClass(classData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw error when professorId is missing', async () => {
      const classData = {
        name: 'Math 101',
      };

      await expect(classService.createClass(classData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should set timestamps on new class', async () => {
      const classData = {
        name: 'Physics 201',
        professorId: 'prof-456',
      };

      mockClassRepository.save.mockResolvedValue(true);

      const result = await classService.createClass(classData);

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.createdAt instanceof Date).toBe(true);
    });
  });

  describe('getClassById', () => {
    it('should retrieve class by id', async () => {
      const mockClass = {
        id: 'class-123',
        name: 'Math 101',
        professorId: 'prof-123',
        students: [],
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);

      const result = await classService.getClassById('class-123');

      expect(result.id).toBe('class-123');
      expect(result.name).toBe('Math 101');
      expect(mockClassRepository.findById).toHaveBeenCalledWith('class-123');
    });

    it('should throw error when class not found', async () => {
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(classService.getClassById('invalid-id')).rejects.toThrow(
        'Class not found'
      );
    });
  });

  describe('updateClass', () => {
    it('should update class successfully', async () => {
      const existingClass = {
        id: 'class-123',
        name: 'Math 101',
        professorId: 'prof-123',
      };

      const updateData = {
        name: 'Advanced Math 101',
        maxStudents: 40,
      };

      mockClassRepository.findById.mockResolvedValue(existingClass);
      mockClassRepository.save.mockResolvedValue(true);

      const result = await classService.updateClass('class-123', updateData);

      expect(result.name).toBe('Advanced Math 101');
      expect(result.maxStudents).toBe(40);
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error when class not found on update', async () => {
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(
        classService.updateClass('invalid-id', { name: 'New Name' })
      ).rejects.toThrow('Class not found');
    });
  });

  describe('deleteClass', () => {
    it('should delete class successfully', async () => {
      const mockClass = {
        id: 'class-123',
        name: 'Math 101',
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockClassRepository.delete.mockResolvedValue(true);

      const result = await classService.deleteClass('class-123');

      expect(result).toBe(true);
      expect(mockClassRepository.delete).toHaveBeenCalledWith('class-123');
    });

    it('should throw error when class not found on delete', async () => {
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(classService.deleteClass('invalid-id')).rejects.toThrow(
        'Class not found'
      );
    });
  });

  describe('addStudentToClass', () => {
    it('should add student to class successfully', async () => {
      const mockClass = {
        id: 'class-123',
        name: 'Math 101',
        students: [],
      };

      const mockStudent = {
        id: 'student-123',
        name: 'John Doe',
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockStudentRepository.findById.mockResolvedValue(mockStudent);
      mockClassRepository.save.mockResolvedValue(true);

      const result = await classService.addStudentToClass('class-123', 'student-123');

      expect(result.students).toContain('student-123');
      expect(mockClassRepository.save).toHaveBeenCalled();
    });

    it('should throw error when class not found', async () => {
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(
        classService.addStudentToClass('invalid-id', 'student-123')
      ).rejects.toThrow('Class not found');
    });

    it('should throw error when student not found', async () => {
      const mockClass = {
        id: 'class-123',
        students: [],
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockStudentRepository.findById.mockResolvedValue(null);

      await expect(
        classService.addStudentToClass('class-123', 'invalid-student')
      ).rejects.toThrow('Student not found');
    });

    it('should throw error when student already in class', async () => {
      const mockClass = {
        id: 'class-123',
        students: ['student-123'],
      };

      const mockStudent = {
        id: 'student-123',
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockStudentRepository.findById.mockResolvedValue(mockStudent);

      await expect(
        classService.addStudentToClass('class-123', 'student-123')
      ).rejects.toThrow('Student already in class');
    });
  });

  describe('removeStudentFromClass', () => {
    it('should remove student from class successfully', async () => {
      const mockClass = {
        id: 'class-123',
        students: ['student-123', 'student-456'],
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockClassRepository.save.mockResolvedValue(true);

      const result = await classService.removeStudentFromClass('class-123', 'student-123');

      expect(result.students).not.toContain('student-123');
      expect(result.students).toContain('student-456');
    });

    it('should throw error when class not found', async () => {
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(
        classService.removeStudentFromClass('invalid-id', 'student-123')
      ).rejects.toThrow('Class not found');
    });
  });

  describe('getClassesByProfessor', () => {
    it('should retrieve all classes by professor', async () => {
      const mockClasses = [
        { id: 'class-1', name: 'Math 101' },
        { id: 'class-2', name: 'Math 201' },
      ];

      mockClassRepository.findByProfessor.mockResolvedValue(mockClasses);

      const result = await classService.getClassesByProfessor('prof-123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Math 101');
    });

    it('should return empty array when professor has no classes', async () => {
      mockClassRepository.findByProfessor.mockResolvedValue(null);

      const result = await classService.getClassesByProfessor('prof-999');

      expect(result).toEqual([]);
    });
  });

  describe('getClassStudents', () => {
    it('should retrieve all students in class', async () => {
      const mockClass = {
        id: 'class-123',
        students: ['student-1', 'student-2'],
      };

      const mockStudents = [
        { id: 'student-1', name: 'John' },
        { id: 'student-2', name: 'Jane' },
      ];

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockStudentRepository.findByIds.mockResolvedValue(mockStudents);

      const result = await classService.getClassStudents('class-123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John');
    });

    it('should throw error when class not found', async () => {
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(classService.getClassStudents('invalid-id')).rejects.toThrow(
        'Class not found'
      );
    });
  });

  describe('getClassCount', () => {
    it('should return count of classes for professor', async () => {
      const mockClasses = [
        { id: 'class-1' },
        { id: 'class-2' },
        { id: 'class-3' },
      ];

      mockClassRepository.findByProfessor.mockResolvedValue(mockClasses);

      const result = await classService.getClassCount('prof-123');

      expect(result).toBe(3);
    });

    it('should return 0 when professor has no classes', async () => {
      mockClassRepository.findByProfessor.mockResolvedValue(null);

      const result = await classService.getClassCount('prof-999');

      expect(result).toBe(0);
    });
  });

  describe('checkStudentInClass', () => {
    it('should return true when student is in class', async () => {
      const mockClass = {
        id: 'class-123',
        students: ['student-123', 'student-456'],
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);

      const result = await classService.checkStudentInClass('class-123', 'student-123');

      expect(result).toBe(true);
    });

    it('should return false when student is not in class', async () => {
      const mockClass = {
        id: 'class-123',
        students: ['student-123'],
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);

      const result = await classService.checkStudentInClass('class-123', 'student-999');

      expect(result).toBe(false);
    });

    it('should throw error when class not found', async () => {
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(
        classService.checkStudentInClass('invalid-id', 'student-123')
      ).rejects.toThrow('Class not found');
    });
  });
});
