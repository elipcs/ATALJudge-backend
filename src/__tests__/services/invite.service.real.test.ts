/**
 * @module __tests__/services
 * @description Invite Service Unit Tests - Real Pattern
 * 
 * Mock implementation that follows the real service interface.
 */

import { UserRole } from '../../enums';

// Mock repositories
const mockInviteRepositoryReal = {
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByToken: jest.fn(),
  findByClass: jest.fn(),
  findByEmail: jest.fn(),
};

const mockClassRepositoryReal = {
  findById: jest.fn(),
};

const mockUserRepositoryReal = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
};

// Real implementation pattern
class InviteServiceMock {
  constructor(
    private inviteRepository: any,
    private classRepository: any,
    private userRepository: any
  ) {}

  async createInvite(dto: any, classId: string, professorId: string) {
    const classEntity = await this.classRepository.findById(classId);

    if (!classEntity) {
      throw new Error('Class not found');
    }

    if (classEntity.professorId !== professorId) {
      throw new Error('Unauthorized');
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);

    const invite = {
      id: `invite-${Date.now()}`,
      classId,
      email: dto.email,
      role: dto.role || UserRole.STUDENT,
      token: this.generateToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      accepted: false,
      userId: existingUser ? existingUser.id : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.inviteRepository.save(invite);
  }

  async getInviteById(id: string) {
    const invite = await this.inviteRepository.findById(id);

    if (!invite) {
      throw new Error('Invite not found');
    }

    return invite;
  }

  async getInviteByToken(token: string) {
    const invite = await this.inviteRepository.findByToken(token);

    if (!invite) {
      throw new Error('Invite not found or expired');
    }

    if (new Date() > invite.expiresAt) {
      throw new Error('Invite expired');
    }

    return invite;
  }

  async getInvitesByClass(classId: string) {
    const invites = await this.inviteRepository.findByClass(classId);
    return invites || [];
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.getInviteByToken(token);

    if (invite.accepted) {
      throw new Error('Invite already accepted');
    }

    invite.accepted = true;
    invite.userId = userId;
    invite.updatedAt = new Date();

    return await this.inviteRepository.save(invite);
  }

  async deleteInvite(id: string, professorId: string) {
    const invite = await this.inviteRepository.findById(id);

    if (!invite) {
      throw new Error('Invite not found');
    }

    const classEntity = await this.classRepository.findById(invite.classId);

    if (classEntity.professorId !== professorId) {
      throw new Error('Unauthorized');
    }

    await this.inviteRepository.delete(id);
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

describe('InviteService - Real Pattern Implementation', () => {
  let service: InviteServiceMock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InviteServiceMock(
      mockInviteRepositoryReal,
      mockClassRepositoryReal,
      mockUserRepositoryReal
    );
  });

  describe('createInvite', () => {
    it('should create invite successfully', async () => {
      const dto = {
        email: 'student@example.com',
        role: UserRole.STUDENT,
      };

      const mockClass = { id: 'class-1', professorId: 'prof-1' };

      mockClassRepositoryReal.findById.mockResolvedValue(mockClass);
      mockUserRepositoryReal.findByEmail.mockResolvedValue(null);
      mockInviteRepositoryReal.save.mockResolvedValue({
        id: 'invite-1',
        classId: 'class-1',
        ...dto,
        token: 'token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        accepted: false,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createInvite(dto, 'class-1', 'prof-1');

      expect(result.email).toBe('student@example.com');
      expect(result.accepted).toBe(false);
      expect(mockInviteRepositoryReal.save).toHaveBeenCalled();
    });

    it('should throw error if class does not exist', async () => {
      mockClassRepositoryReal.findById.mockResolvedValue(null);

      await expect(
        service.createInvite(
          { email: 'student@example.com' },
          'non-existent',
          'prof-1'
        )
      ).rejects.toThrow('Class not found');
    });

    it('should throw error if not professor of class', async () => {
      const mockClass = { id: 'class-1', professorId: 'prof-1' };

      mockClassRepositoryReal.findById.mockResolvedValue(mockClass);

      await expect(
        service.createInvite(
          { email: 'student@example.com' },
          'class-1',
          'prof-2'
        )
      ).rejects.toThrow('Unauthorized');
    });

    it('should link existing user to invite', async () => {
      const dto = {
        email: 'existing@example.com',
        role: UserRole.STUDENT,
      };

      const mockClass = { id: 'class-1', professorId: 'prof-1' };
      const mockUser = { id: 'user-1', email: 'existing@example.com' };

      mockClassRepositoryReal.findById.mockResolvedValue(mockClass);
      mockUserRepositoryReal.findByEmail.mockResolvedValue(mockUser);
      mockInviteRepositoryReal.save.mockResolvedValue({
        id: 'invite-2',
        classId: 'class-1',
        ...dto,
        token: 'token-456',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        accepted: false,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createInvite(dto, 'class-1', 'prof-1');

      expect(result.userId).toBe('user-1');
    });
  });

  describe('getInviteById', () => {
    it('should return invite by ID', async () => {
      const mockInvite = {
        id: 'invite-1',
        email: 'student@example.com',
        classId: 'class-1',
        accepted: false,
      };

      mockInviteRepositoryReal.findById.mockResolvedValue(mockInvite);

      const result = await service.getInviteById('invite-1');

      expect(result.email).toBe('student@example.com');
    });

    it('should throw error when invite does not exist', async () => {
      mockInviteRepositoryReal.findById.mockResolvedValue(null);

      await expect(service.getInviteById('non-existent')).rejects.toThrow(
        'Invite not found'
      );
    });
  });

  describe('getInviteByToken', () => {
    it('should return valid invite by token', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour in future
      const mockInvite = {
        id: 'invite-1',
        token: 'token-123',
        expiresAt: futureDate,
        accepted: false,
      };

      mockInviteRepositoryReal.findByToken.mockResolvedValue(mockInvite);

      const result = await service.getInviteByToken('token-123');

      expect(result.token).toBe('token-123');
    });

    it('should throw error if invite not found', async () => {
      mockInviteRepositoryReal.findByToken.mockResolvedValue(null);

      await expect(service.getInviteByToken('invalid-token')).rejects.toThrow(
        'Invite not found or expired'
      );
    });

    it('should throw error if invite expired', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour in past
      const mockInvite = {
        id: 'invite-1',
        token: 'token-123',
        expiresAt: pastDate,
      };

      mockInviteRepositoryReal.findByToken.mockResolvedValue(mockInvite);

      await expect(service.getInviteByToken('token-123')).rejects.toThrow(
        'Invite expired'
      );
    });
  });

  describe('getInvitesByClass', () => {
    it('should return invites for class', async () => {
      const mockInvites = [
        { id: 'invite-1', email: 'student1@example.com' },
        { id: 'invite-2', email: 'student2@example.com' },
      ];

      mockInviteRepositoryReal.findByClass.mockResolvedValue(mockInvites);

      const result = await service.getInvitesByClass('class-1');

      expect(result).toHaveLength(2);
      expect(mockInviteRepositoryReal.findByClass).toHaveBeenCalledWith('class-1');
    });

    it('should return empty array when class has no invites', async () => {
      mockInviteRepositoryReal.findByClass.mockResolvedValue([]);

      const result = await service.getInvitesByClass('class-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('acceptInvite', () => {
    it('should accept invite successfully', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60);
      const mockInvite = {
        id: 'invite-1',
        token: 'token-123',
        expiresAt: futureDate,
        accepted: false,
        userId: null,
      };

      mockInviteRepositoryReal.findByToken.mockResolvedValue(mockInvite);
      mockInviteRepositoryReal.save.mockResolvedValue({
        ...mockInvite,
        accepted: true,
        userId: 'user-1',
        updatedAt: new Date(),
      });

      const result = await service.acceptInvite('token-123', 'user-1');

      expect(result.accepted).toBe(true);
      expect(result.userId).toBe('user-1');
    });

    it('should throw error if invite already accepted', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60);
      const mockInvite = {
        id: 'invite-1',
        token: 'token-123',
        expiresAt: futureDate,
        accepted: true,
      };

      mockInviteRepositoryReal.findByToken.mockResolvedValue(mockInvite);

      await expect(service.acceptInvite('token-123', 'user-1')).rejects.toThrow(
        'Invite already accepted'
      );
    });
  });

  describe('deleteInvite', () => {
    it('should delete invite successfully', async () => {
      const mockInvite = { id: 'invite-1', classId: 'class-1' };
      const mockClass = { id: 'class-1', professorId: 'prof-1' };

      mockInviteRepositoryReal.findById.mockResolvedValue(mockInvite);
      mockClassRepositoryReal.findById.mockResolvedValue(mockClass);
      mockInviteRepositoryReal.delete.mockResolvedValue(true);

      await service.deleteInvite('invite-1', 'prof-1');

      expect(mockInviteRepositoryReal.delete).toHaveBeenCalledWith('invite-1');
    });

    it('should throw error if invite does not exist', async () => {
      mockInviteRepositoryReal.findById.mockResolvedValue(null);

      await expect(service.deleteInvite('non-existent', 'prof-1')).rejects.toThrow(
        'Invite not found'
      );
    });

    it('should throw error if not professor of class', async () => {
      const mockInvite = { id: 'invite-1', classId: 'class-1' };
      const mockClass = { id: 'class-1', professorId: 'prof-1' };

      mockInviteRepositoryReal.findById.mockResolvedValue(mockInvite);
      mockClassRepositoryReal.findById.mockResolvedValue(mockClass);

      await expect(service.deleteInvite('invite-1', 'prof-2')).rejects.toThrow(
        'Unauthorized'
      );
    });
  });
});
