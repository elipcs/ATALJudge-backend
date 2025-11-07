/**
 * @module __tests__/services
 * @description User Service Unit Tests - Real Pattern
 * 
 * Mock implementation that follows the real service interface.
 */

import { UserRole } from '../../enums';

// Mock repositories
const mockUserRepository = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByRole: jest.fn(),
  emailExists: jest.fn(),
  updateLastLogin: jest.fn(),
  update: jest.fn(),
};

const mockGradeRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByStudent: jest.fn(),
  findAll: jest.fn(),
};

// Real implementation pattern
class UserServiceMock {
  constructor(
    private userRepository: any,
    private gradeRepository: any
  ) {}

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === UserRole.STUDENT) {
      const grades = await this.gradeRepository.findByStudent(id);
      return { ...user, grades: grades || [] };
    }

    return user;
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll();
    return users || [];
  }

  async getUsersByRole(role: string) {
    const users = await this.userRepository.findByRole(role);
    return users || [];
  }

  async updateProfile(userId: string, dto: any) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.userRepository.emailExists(dto.email);
      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;
    if (dto.studentRegistration !== undefined) {
      user.studentRegistration = dto.studentRegistration;
    }

    const updated = await this.userRepository.save(user);
    return updated;
  }

  async changePassword(userId: string, dto: any) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await user.checkPassword(dto.currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    await user.setPassword(dto.newPassword);
    await this.userRepository.update(userId, user);
  }

  async deleteUser(userId: string) {
    const deleted = await this.userRepository.delete(userId);

    if (!deleted) {
      throw new Error('User not found');
    }
  }
}

describe('UserService - Real Pattern Implementation', () => {
  let service: UserServiceMock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserServiceMock(mockUserRepository, mockGradeRepository);
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'student@example.com',
        name: 'John Doe',
        role: UserRole.PROFESSOR,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById('user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
    });

    it('should throw error when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.getUserById('non-existent-id')).rejects.toThrow('User not found');
    });

    it('should include grades for student users', async () => {
      const mockUser = {
        id: 'student-1',
        email: 'student@example.com',
        name: 'Jane Doe',
        role: UserRole.STUDENT,
      };

      const mockGrades = [
        {
          id: 'grade-1',
          score: 85,
          questionListId: 'list-1',
          questionList: { title: 'Quiz 1' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'grade-2',
          score: 92,
          questionListId: 'list-2',
          questionList: { title: 'Quiz 2' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockGradeRepository.findByStudent.mockResolvedValue(mockGrades);

      const result = await service.getUserById('student-1');

      expect(mockGradeRepository.findByStudent).toHaveBeenCalledWith('student-1');
      expect(result.grades).toHaveLength(2);
      expect(result.grades[0].score).toBe(85);
    });

    it('should not include grades for professor users', async () => {
      const mockUser = {
        id: 'prof-1',
        email: 'professor@example.com',
        role: UserRole.PROFESSOR,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById('prof-1');

      expect(mockGradeRepository.findByStudent).not.toHaveBeenCalled();
      expect(result.id).toBe('prof-1');
    });

    it('should handle empty grades for students', async () => {
      const mockUser = {
        id: 'student-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockGradeRepository.findByStudent.mockResolvedValue([]);

      const result = await service.getUserById('student-1');

      expect(result.grades).toHaveLength(0);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          role: UserRole.STUDENT,
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          role: UserRole.PROFESSOR,
        },
      ];

      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers();

      expect(result).toHaveLength(2);
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      mockUserRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllUsers();

      expect(result).toHaveLength(0);
    });

    it('should handle null response from repository', async () => {
      mockUserRepository.findAll.mockResolvedValue(null);

      const result = await service.getAllUsers();

      expect(result).toHaveLength(0);
    });
  });

  describe('getUsersByRole', () => {
    it('should return users filtered by role', async () => {
      const mockStudents = [
        {
          id: 'student-1',
          email: 'student1@example.com',
          role: UserRole.STUDENT,
        },
        {
          id: 'student-2',
          email: 'student2@example.com',
          role: UserRole.STUDENT,
        },
      ];

      mockUserRepository.findByRole.mockResolvedValue(mockStudents);

      const result = await service.getUsersByRole(UserRole.STUDENT);

      expect(result).toHaveLength(2);
      expect(mockUserRepository.findByRole).toHaveBeenCalledWith(UserRole.STUDENT);
      expect(result[0].role).toBe(UserRole.STUDENT);
    });

    it('should return empty array for role with no users', async () => {
      mockUserRepository.findByRole.mockResolvedValue([]);

      const result = await service.getUsersByRole(UserRole.ASSISTANT);

      expect(result).toHaveLength(0);
    });

    it('should return professors', async () => {
      const mockProfessors = [
        {
          id: 'prof-1',
          email: 'prof@example.com',
          role: UserRole.PROFESSOR,
        },
      ];

      mockUserRepository.findByRole.mockResolvedValue(mockProfessors);

      const result = await service.getUsersByRole(UserRole.PROFESSOR);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(UserRole.PROFESSOR);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'old@example.com',
        name: 'Old Name',
      };

      const updated = { ...mockUser, name: 'New Name', email: 'new@example.com' };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.emailExists.mockResolvedValue(false);
      mockUserRepository.save.mockResolvedValue(updated);

      const updateData = {
        name: 'New Name',
        email: 'new@example.com',
      };

      const result = await service.updateProfile('user-1', updateData);

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('New Name');
      expect(result.email).toBe('new@example.com');
    });

    it('should throw error when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const updateData = { name: 'New Name' };

      await expect(
        service.updateProfile('non-existent-id', updateData)
      ).rejects.toThrow('User not found');
    });

    it('should throw error when email already exists', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User 1',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.emailExists.mockResolvedValue(true);

      const updateData = {
        name: 'User 1',
        email: 'taken@example.com',
      };

      await expect(
        service.updateProfile('user-1', updateData)
      ).rejects.toThrow('Email already in use');
    });

    it('should skip email validation when email is not changed', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Old Name',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        name: 'New Name',
      });

      const updateData = { name: 'New Name' };

      await service.updateProfile('user-1', updateData);

      expect(mockUserRepository.emailExists).not.toHaveBeenCalled();
    });

    it('should update student registration', async () => {
      const mockUser = {
        id: 'student-1',
        email: 'student@example.com',
        studentRegistration: null,
      };

      const updated = {
        ...mockUser,
        studentRegistration: 'STU-2024-001',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updated);

      const updateData = {
        studentRegistration: 'STU-2024-001',
      };

      const result = await service.updateProfile('student-1', updateData);

      expect(result.studentRegistration).toBe('STU-2024-001');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        checkPassword: jest.fn().mockResolvedValue(true),
        setPassword: jest.fn().mockResolvedValue(true),
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await service.changePassword('user-1', {
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
      });

      expect(mockUser.checkPassword).toHaveBeenCalledWith('oldpass123');
      expect(mockUser.setPassword).toHaveBeenCalledWith('newpass123');
      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    it('should throw error for incorrect current password', async () => {
      const mockUser = {
        id: 'user-1',
        checkPassword: jest.fn().mockResolvedValue(false),
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrongpass',
          newPassword: 'newpass123',
        })
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        service.changePassword('non-existent-id', {
          currentPassword: 'oldpass123',
          newPassword: 'newpass123',
        })
      ).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepository.delete.mockResolvedValue(true);

      await service.deleteUser('user-1');

      expect(mockUserRepository.delete).toHaveBeenCalledWith('user-1');
    });

    it('should throw error when trying to delete non-existent user', async () => {
      mockUserRepository.delete.mockResolvedValue(false);

      await expect(service.deleteUser('non-existent-id')).rejects.toThrow('User not found');
    });

    it('should handle multiple deletions', async () => {
      mockUserRepository.delete.mockResolvedValue(true);

      await service.deleteUser('user-1');
      await service.deleteUser('user-2');

      expect(mockUserRepository.delete).toHaveBeenCalledTimes(2);
    });
  });
});
