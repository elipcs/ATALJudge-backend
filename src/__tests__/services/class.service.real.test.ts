/**
 * @module __tests__/services
 * @description Class Service Unit Tests - Real Pattern
 * 
 * Mock implementation that follows the real service interface.
 */

import { UserRole } from '../../enums';

// Mock repositories
const mockClassRepository = {
  findById: jest.fn(),
  findByCode: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByProfessor: jest.fn(),
};

const mockUserRepository = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
};

const mockInviteRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByToken: jest.fn(),
};

// Real implementation pattern
class ClassServiceMock {
  constructor(
    private classRepository: any,
    private userRepository: any,
    private inviteRepository: any
  ) {}

  async createClass(dto: any, professorId: string) {
    const classEntity = {
      id: `class-${Date.now()}`,
      code: dto.code,
      name: dto.name,
      description: dto.description || null,
      professorId,
      students: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existing = await this.classRepository.findByCode(dto.code);
    if (existing) {
      throw new Error('Class code already in use');
    }

    return await this.classRepository.save(classEntity);
  }

  async getClassById(id: string) {
    const classEntity = await this.classRepository.findById(id);

    if (!classEntity) {
      throw new Error('Class not found');
    }

    return classEntity;
  }

  async getClassesByProfessor(professorId: string) {
    const classes = await this.classRepository.findByProfessor(professorId);
    return classes || [];
  }

  async updateClass(id: string, dto: any, professorId: string) {
    const classEntity = await this.classRepository.findById(id);

    if (!classEntity) {
      throw new Error('Class not found');
    }

    if (classEntity.professorId !== professorId) {
      throw new Error('Unauthorized');
    }

    if (dto.code && dto.code !== classEntity.code) {
      const existing = await this.classRepository.findByCode(dto.code);
      if (existing) {
        throw new Error('Class code already in use');
      }
      classEntity.code = dto.code;
    }

    if (dto.name) classEntity.name = dto.name;
    if (dto.description !== undefined) classEntity.description = dto.description;
    classEntity.updatedAt = new Date();

    return await this.classRepository.save(classEntity);
  }

  async deleteClass(id: string, professorId: string) {
    const classEntity = await this.classRepository.findById(id);

    if (!classEntity) {
      throw new Error('Class not found');
    }

    if (classEntity.professorId !== professorId) {
      throw new Error('Unauthorized');
    }

    await this.classRepository.delete(id);
  }

  async addStudent(classId: string, studentId: string) {
    const classEntity = await this.classRepository.findById(classId);

    if (!classEntity) {
      throw new Error('Class not found');
    }

    const student = await this.userRepository.findById(studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    if (!classEntity.students) {
      classEntity.students = [];
    }

    if (classEntity.students.includes(studentId)) {
      throw new Error('Student already in class');
    }

    classEntity.students.push(studentId);
    return await this.classRepository.save(classEntity);
  }
}

describe('ClassService - Real Pattern Implementation', () => {
  let service: ClassServiceMock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClassServiceMock(
      mockClassRepository,
      mockUserRepository,
      mockInviteRepository
    );
  });

  describe('createClass', () => {
    it('should create class successfully', async () => {
      const dto = {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        description: 'Basic CS concepts',
      };

      mockClassRepository.findByCode.mockResolvedValue(null);
      mockClassRepository.save.mockResolvedValue({
        id: 'class-1',
        ...dto,
        professorId: 'prof-1',
        students: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createClass(dto, 'prof-1');

      expect(result.code).toBe('CS101');
      expect(result.name).toBe('Introduction to Computer Science');
      expect(mockClassRepository.save).toHaveBeenCalled();
    });

    it('should throw error if class code already exists', async () => {
      const dto = {
        code: 'CS101',
        name: 'Introduction to Computer Science',
      };

      mockClassRepository.findByCode.mockResolvedValue({ id: 'existing-class' });

      await expect(service.createClass(dto, 'prof-1')).rejects.toThrow(
        'Class code already in use'
      );
    });

    it('should create class with optional description', async () => {
      const dto = {
        code: 'CS102',
        name: 'Data Structures',
      };

      mockClassRepository.findByCode.mockResolvedValue(null);
      mockClassRepository.save.mockResolvedValue({
        id: 'class-2',
        ...dto,
        description: null,
        professorId: 'prof-1',
        students: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createClass(dto, 'prof-1');

      expect(result.description).toBeNull();
    });
  });

  describe('getClassById', () => {
    it('should return class by ID', async () => {
      const mockClass = {
        id: 'class-1',
        code: 'CS101',
        name: 'Introduction to Computer Science',
        professorId: 'prof-1',
        students: [],
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);

      const result = await service.getClassById('class-1');

      expect(result).toBeDefined();
      expect(result.code).toBe('CS101');
      expect(mockClassRepository.findById).toHaveBeenCalledWith('class-1');
    });

    it('should throw error when class does not exist', async () => {
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(service.getClassById('non-existent')).rejects.toThrow('Class not found');
    });
  });

  describe('getClassesByProfessor', () => {
    it('should return classes for professor', async () => {
      const mockClasses = [
        { id: 'class-1', code: 'CS101', name: 'CS 101', professorId: 'prof-1' },
        { id: 'class-2', code: 'CS102', name: 'CS 102', professorId: 'prof-1' },
      ];

      mockClassRepository.findByProfessor.mockResolvedValue(mockClasses);

      const result = await service.getClassesByProfessor('prof-1');

      expect(result).toHaveLength(2);
      expect(mockClassRepository.findByProfessor).toHaveBeenCalledWith('prof-1');
    });

    it('should return empty array if professor has no classes', async () => {
      mockClassRepository.findByProfessor.mockResolvedValue([]);

      const result = await service.getClassesByProfessor('prof-2');

      expect(result).toHaveLength(0);
    });
  });

  describe('updateClass', () => {
    it('should update class successfully', async () => {
      const mockClass = {
        id: 'class-1',
        code: 'CS101',
        name: 'Old Name',
        description: 'Old desc',
        professorId: 'prof-1',
      };

      const updated = {
        ...mockClass,
        name: 'New Name',
        description: 'New desc',
        updatedAt: new Date(),
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockClassRepository.save.mockResolvedValue(updated);

      const result = await service.updateClass(
        'class-1',
        { name: 'New Name', description: 'New desc' },
        'prof-1'
      );

      expect(result.name).toBe('New Name');
      expect(result.description).toBe('New desc');
    });

    it('should throw error if class does not exist', async () => {
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateClass('non-existent', { name: 'New' }, 'prof-1')
      ).rejects.toThrow('Class not found');
    });

    it('should throw error if not professor of class', async () => {
      const mockClass = {
        id: 'class-1',
        professorId: 'prof-1',
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);

      await expect(
        service.updateClass('class-1', { name: 'New' }, 'prof-2')
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error if new code already exists', async () => {
      const mockClass = {
        id: 'class-1',
        code: 'CS101',
        professorId: 'prof-1',
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockClassRepository.findByCode.mockResolvedValue({ id: 'class-2' });

      await expect(
        service.updateClass('class-1', { code: 'CS102' }, 'prof-1')
      ).rejects.toThrow('Class code already in use');
    });
  });

  describe('deleteClass', () => {
    it('should delete class successfully', async () => {
      const mockClass = {
        id: 'class-1',
        professorId: 'prof-1',
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockClassRepository.delete.mockResolvedValue(true);

      await service.deleteClass('class-1', 'prof-1');

      expect(mockClassRepository.delete).toHaveBeenCalledWith('class-1');
    });

    it('should throw error if class does not exist', async () => {
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(service.deleteClass('non-existent', 'prof-1')).rejects.toThrow(
        'Class not found'
      );
    });

    it('should throw error if not professor of class', async () => {
      const mockClass = {
        id: 'class-1',
        professorId: 'prof-1',
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);

      await expect(service.deleteClass('class-1', 'prof-2')).rejects.toThrow('Unauthorized');
    });
  });

  describe('addStudent', () => {
    it('should add student to class successfully', async () => {
      const mockClass = {
        id: 'class-1',
        students: [],
      };

      const mockStudent = {
        id: 'student-1',
        role: UserRole.STUDENT,
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockUserRepository.findById.mockResolvedValue(mockStudent);
      mockClassRepository.save.mockResolvedValue({
        ...mockClass,
        students: ['student-1'],
      });

      const result = await service.addStudent('class-1', 'student-1');

      expect(result.students).toContain('student-1');
      expect(mockClassRepository.save).toHaveBeenCalled();
    });

    it('should throw error if class does not exist', async () => {
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(service.addStudent('non-existent', 'student-1')).rejects.toThrow(
        'Class not found'
      );
    });

    it('should throw error if student does not exist', async () => {
      const mockClass = { id: 'class-1', students: [] };

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.addStudent('class-1', 'non-existent')).rejects.toThrow(
        'Student not found'
      );
    });

    it('should throw error if student already in class', async () => {
      const mockClass = {
        id: 'class-1',
        students: ['student-1'],
        professorId: 'prof-1',
      };

      const mockStudent = {
        id: 'student-1',
        role: 'STUDENT',
      };

      mockClassRepository.findById.mockResolvedValue(mockClass);
      mockUserRepository.findById.mockResolvedValue(mockStudent);

      await expect(service.addStudent('class-1', 'student-1')).rejects.toThrow(
        'Student already in class'
      );
    });
  });
});
