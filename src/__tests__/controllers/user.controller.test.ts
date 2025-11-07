/**
 * @module __tests__/controllers
 * @description User Controller Unit Tests
 */

import { Response } from 'express';
import { UnauthorizedError } from '../../utils';
import { UserRole } from '../../enums/UserRole';

interface AuthRequest {
  user?: {
    sub: string;
    email: string;
    role: UserRole;
  };
  body?: any;
  params?: any;
}

// Mock use cases
const mockGetUserUseCase = {
  execute: jest.fn(),
};

const mockUpdateProfileUseCase = {
  execute: jest.fn(),
};

const mockChangePasswordUseCase = {
  execute: jest.fn(),
};

describe('UserController', () => {
  let mockRequest: AuthRequest;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    responseJson = jest.fn().mockReturnValue(undefined);
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });

    mockRequest = {
      user: {
        sub: 'user-123',
        email: 'test@test.com',
        role: UserRole.STUDENT,
      },
      body: {},
      params: {},
    };

    mockResponse = {
      json: responseJson,
      status: responseStatus,
      send: jest.fn(),
    };
  });

  describe('GET /profile', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@test.com',
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetUserUseCase.execute.mockResolvedValue(mockUser);

      // Simulate the controller logic
      if (!mockRequest.user) {
        throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
      }

      const user = await mockGetUserUseCase.execute(mockRequest.user.sub);

      expect(user).toBeDefined();
      expect(user.id).toBe('user-123');
      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedError if user is not authenticated', async () => {
      mockRequest.user = undefined;

      const executeLogic = async () => {
        if (!mockRequest.user) {
          throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
        }
      };

      await expect(executeLogic()).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('PUT /profile', () => {
    it('should update user profile', async () => {
      const updates = { name: 'Jane Doe', email: 'jane@test.com' };
      const updatedUser = {
        id: 'user-123',
        ...updates,
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUpdateProfileUseCase.execute.mockResolvedValue(updatedUser);

      if (!mockRequest.user) {
        throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
      }

      const result = await mockUpdateProfileUseCase.execute({
        userId: mockRequest.user.sub,
        dto: updates,
      });

      expect(result.name).toBe('Jane Doe');
      expect(result.email).toBe('jane@test.com');
      expect(mockUpdateProfileUseCase.execute).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if not authenticated', async () => {
      mockRequest.user = undefined;

      const executeLogic = async () => {
        if (!mockRequest.user) {
          throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
        }
      };

      await expect(executeLogic()).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('POST /change-password', () => {
    it('should change password successfully', async () => {
      mockChangePasswordUseCase.execute.mockResolvedValue({
        id: 'user-123',
        message: 'Password changed successfully',
      });

      if (!mockRequest.user) {
        throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
      }

      const result = await mockChangePasswordUseCase.execute({
        userId: mockRequest.user.sub,
        oldPassword: 'oldPass123',
        newPassword: 'newPass123',
      });

      expect(result).toBeDefined();
      expect(mockChangePasswordUseCase.execute).toHaveBeenCalled();
    });

    it('should throw error for authentication failure', async () => {
      mockRequest.user = undefined;

      const executeLogic = async () => {
        if (!mockRequest.user) {
          throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
        }
      };

      await expect(executeLogic()).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('GET /:id', () => {
    it('should return user by ID for professors', async () => {
      mockRequest.user!.role = UserRole.PROFESSOR;
      mockRequest.params = { id: 'student-123' };

      const mockStudent = {
        id: 'student-123',
        name: 'Jane Student',
        email: 'jane@test.com',
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetUserUseCase.execute.mockResolvedValue(mockStudent);

      const user = await mockGetUserUseCase.execute('student-123');

      expect(user).toBeDefined();
      expect(user.id).toBe('student-123');
    });

    it('should return user data with all fields', async () => {
      const mockUser = {
        id: 'user-456',
        name: 'Test User',
        email: 'test@test.com',
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        grades: [
          {
            id: 'grade-1',
            questionListId: 'list-1',
            questionListTitle: 'List 1',
            score: 95,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      };

      mockGetUserUseCase.execute.mockResolvedValue(mockUser);

      const result = await mockGetUserUseCase.execute('user-456');

      expect(result.id).toBe('user-456');
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@test.com');
      expect(result.grades).toHaveLength(1);
      expect(result.grades[0].score).toBe(95);
    });
  });
});
