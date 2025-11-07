/**
 * @module __tests__/integration
 * @description Class Use Cases Integration Tests
 */

const mockClassRepositoryClass = {
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByProfessor: jest.fn(),
  findWithStudents: jest.fn(),
  addStudent: jest.fn(),
  removeStudent: jest.fn(),
  isStudentInClass: jest.fn(),
};

describe('Class Use Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateClassUseCase', () => {
    it('should create a new class', async () => {
      const newClass = {
        id: 'class-123',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        professorId: 'prof-123',
        maxStudents: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        students: [],
      };

      mockClassRepositoryClass.create.mockResolvedValue(newClass);

      const result = await mockClassRepositoryClass.create(newClass);

      expect(result.id).toBe('class-123');
      expect(result.name).toBe('Introduction to Programming');
      expect(result.professorId).toBe('prof-123');
    });
  });

  describe('GetClassByIdUseCase', () => {
    it('should retrieve class by id', async () => {
      const mockClass = {
        id: 'class-123',
        name: 'Data Structures',
        description: 'Study of data structures',
        professorId: 'prof-456',
        maxStudents: 40,
        students: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClassRepositoryClass.findById.mockResolvedValue(mockClass);

      const result = await mockClassRepositoryClass.findById('class-123');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Data Structures');
      expect(mockClassRepositoryClass.findById).toHaveBeenCalledWith('class-123');
    });

    it('should return null when class does not exist', async () => {
      mockClassRepositoryClass.findById.mockResolvedValue(null);

      const result = await mockClassRepositoryClass.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('AddStudentToClassUseCase', () => {
    it('should add student to class', async () => {
      const classId = 'class-123';
      const studentId = 'student-456';

      mockClassRepositoryClass.addStudent.mockResolvedValue({
        classId,
        studentId,
      });

      const result = await mockClassRepositoryClass.addStudent(classId, studentId);

      expect(result).toBeDefined();
      expect(mockClassRepositoryClass.addStudent).toHaveBeenCalledWith(classId, studentId);
    });

    it('should not add student if already in class', async () => {
      const classId = 'class-123';
      const studentId = 'student-456';

      mockClassRepositoryClass.isStudentInClass.mockResolvedValue(true);

      const isInClass = await mockClassRepositoryClass.isStudentInClass(classId, studentId);

      expect(isInClass).toBe(true);
    });
  });

  describe('RemoveStudentFromClassUseCase', () => {
    it('should remove student from class', async () => {
      const classId = 'class-123';
      const studentId = 'student-456';

      mockClassRepositoryClass.removeStudent.mockResolvedValue(undefined);

      await mockClassRepositoryClass.removeStudent(classId, studentId);

      expect(mockClassRepositoryClass.removeStudent).toHaveBeenCalledWith(classId, studentId);
    });
  });

  describe('GetAllClassesUseCase', () => {
    it('should return all classes for professor', async () => {
      const professorId = 'prof-123';
      const mockClasses = [
        {
          id: 'class-1',
          name: 'Class 1',
          description: 'Description 1',
          professorId,
          maxStudents: 50,
          students: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'class-2',
          name: 'Class 2',
          description: 'Description 2',
          professorId,
          maxStudents: 40,
          students: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockClassRepositoryClass.findByProfessor.mockResolvedValue(mockClasses);

      const result = await mockClassRepositoryClass.findByProfessor(professorId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Class 1');
      expect(result[1].name).toBe('Class 2');
    });

    it('should return empty array when professor has no classes', async () => {
      mockClassRepositoryClass.findByProfessor.mockResolvedValue([]);

      const result = await mockClassRepositoryClass.findByProfessor('prof-999');

      expect(result).toHaveLength(0);
    });
  });

  describe('GetClassStudentsUseCase', () => {
    it('should return all students in a class', async () => {
      const classId = 'class-123';
      const mockStudents = [
        { id: 'student-1', name: 'Student 1' },
        { id: 'student-2', name: 'Student 2' },
        { id: 'student-3', name: 'Student 3' },
      ];

      mockClassRepositoryClass.findWithStudents.mockResolvedValue({
        id: classId,
        name: 'Class 123',
        students: mockStudents,
      });

      const result = await mockClassRepositoryClass.findWithStudents(classId);

      expect(result?.students).toHaveLength(3);
      expect(result?.students[0].name).toBe('Student 1');
    });
  });

  describe('UpdateClassUseCase', () => {
    it('should update class information', async () => {
      const classId = 'class-123';
      const updates = {
        name: 'Updated Class Name',
        description: 'Updated description',
        maxStudents: 60,
      };

      const updatedClass = {
        id: classId,
        ...updates,
        professorId: 'prof-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClassRepositoryClass.save.mockResolvedValue(updatedClass);

      const result = await mockClassRepositoryClass.save(updatedClass);

      expect(result.name).toBe('Updated Class Name');
      expect(result.maxStudents).toBe(60);
    });
  });

  describe('DeleteClassUseCase', () => {
    it('should delete a class', async () => {
      const classId = 'class-123';

      mockClassRepositoryClass.delete.mockResolvedValue(undefined);

      await mockClassRepositoryClass.delete(classId);

      expect(mockClassRepositoryClass.delete).toHaveBeenCalledWith(classId);
    });
  });
});

describe('Class Use Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateClassUseCase', () => {
    it('should create a new class', async () => {
      const newClass = {
        id: 'class-123',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        professorId: 'prof-123',
        maxStudents: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        students: [],
      };

      mockClassRepositoryClass.create.mockResolvedValue(newClass);

      const result = await mockClassRepositoryClass.create(newClass);

      expect(result.id).toBe('class-123');
      expect(result.name).toBe('Introduction to Programming');
      expect(result.professorId).toBe('prof-123');
    });
  });

  describe('GetClassByIdUseCase', () => {
    it('should retrieve class by id', async () => {
      const mockClass = {
        id: 'class-123',
        name: 'Data Structures',
        description: 'Study of data structures',
        professorId: 'prof-456',
        maxStudents: 40,
        students: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClassRepositoryClass.findById.mockResolvedValue(mockClass);

      const result = await mockClassRepositoryClass.findById('class-123');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Data Structures');
      expect(mockClassRepositoryClass.findById).toHaveBeenCalledWith('class-123');
    });

    it('should return null when class does not exist', async () => {
      mockClassRepositoryClass.findById.mockResolvedValue(null);

      const result = await mockClassRepositoryClass.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('AddStudentToClassUseCase', () => {
    it('should add student to class', async () => {
      const classId = 'class-123';
      const studentId = 'student-456';

      mockClassRepositoryClass.addStudent.mockResolvedValue({
        classId,
        studentId,
      });

      const result = await mockClassRepositoryClass.addStudent(classId, studentId);

      expect(result).toBeDefined();
      expect(mockClassRepositoryClass.addStudent).toHaveBeenCalledWith(classId, studentId);
    });

    it('should not add student if already in class', async () => {
      const classId = 'class-123';
      const studentId = 'student-456';

      mockClassRepositoryClass.isStudentInClass.mockResolvedValue(true);

      const isInClass = await mockClassRepositoryClass.isStudentInClass(classId, studentId);

      expect(isInClass).toBe(true);
    });
  });

  describe('RemoveStudentFromClassUseCase', () => {
    it('should remove student from class', async () => {
      const classId = 'class-123';
      const studentId = 'student-456';

      mockClassRepositoryClass.removeStudent.mockResolvedValue(undefined);

      await mockClassRepositoryClass.removeStudent(classId, studentId);

      expect(mockClassRepositoryClass.removeStudent).toHaveBeenCalledWith(classId, studentId);
    });
  });

  describe('GetAllClassesUseCase', () => {
    it('should return all classes for professor', async () => {
      const professorId = 'prof-123';
      const mockClasses = [
        {
          id: 'class-1',
          name: 'Class 1',
          description: 'Description 1',
          professorId,
          maxStudents: 50,
          students: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'class-2',
          name: 'Class 2',
          description: 'Description 2',
          professorId,
          maxStudents: 40,
          students: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockClassRepositoryClass.findByProfessor.mockResolvedValue(mockClasses);

      const result = await mockClassRepositoryClass.findByProfessor(professorId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Class 1');
      expect(result[1].name).toBe('Class 2');
    });

    it('should return empty array when professor has no classes', async () => {
      mockClassRepositoryClass.findByProfessor.mockResolvedValue([]);

      const result = await mockClassRepositoryClass.findByProfessor('prof-999');

      expect(result).toHaveLength(0);
    });
  });

  describe('GetClassStudentsUseCase', () => {
    it('should return all students in a class', async () => {
      const classId = 'class-123';
      const mockStudents = [
        { id: 'student-1', name: 'Student 1' },
        { id: 'student-2', name: 'Student 2' },
        { id: 'student-3', name: 'Student 3' },
      ];

      mockClassRepositoryClass.findWithStudents.mockResolvedValue({
        id: classId,
        name: 'Class 123',
        students: mockStudents,
      });

      const result = await mockClassRepositoryClass.findWithStudents(classId);

      expect(result?.students).toHaveLength(3);
      expect(result?.students[0].name).toBe('Student 1');
    });
  });

  describe('UpdateClassUseCase', () => {
    it('should update class information', async () => {
      const classId = 'class-123';
      const updates = {
        name: 'Updated Class Name',
        description: 'Updated description',
        maxStudents: 60,
      };

      const updatedClass = {
        id: classId,
        ...updates,
        professorId: 'prof-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClassRepositoryClass.save.mockResolvedValue(updatedClass);

      const result = await mockClassRepositoryClass.save(updatedClass);

      expect(result.name).toBe('Updated Class Name');
      expect(result.maxStudents).toBe(60);
    });
  });

  describe('DeleteClassUseCase', () => {
    it('should delete a class', async () => {
      const classId = 'class-123';

      mockClassRepositoryClass.delete.mockResolvedValue(undefined);

      await mockClassRepositoryClass.delete(classId);

      expect(mockClassRepositoryClass.delete).toHaveBeenCalledWith(classId);
    });
  });
});
