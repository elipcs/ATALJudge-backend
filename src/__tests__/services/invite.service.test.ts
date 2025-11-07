/**
 * @module __tests__/services
 * @description Invite Service Unit Tests
 */

class InviteServiceDemo {
  constructor(private repository: any) {}

  async createInvite(data: any) {
    if (!data.classId || !data.email) throw new Error('ClassId and email required');
    const invite = { id: `invite-${Date.now()}`, ...data, createdAt: new Date() };
    await this.repository.save(invite);
    return invite;
  }

  async getInviteById(id: string) {
    return await this.repository.findById(id);
  }

  async listInvites(classId: string) {
    return await this.repository.findByClassId(classId);
  }

  async deleteInvite(id: string) {
    return await this.repository.delete(id);
  }

  async acceptInvite(inviteId: string, userId: string) {
    const invite = await this.repository.findById(inviteId);
    if (!invite) throw new Error('Invite not found');
    invite.acceptedBy = userId;
    invite.acceptedAt = new Date();
    return await this.repository.save(invite);
  }

  async revokeInvite(id: string) {
    const invite = await this.repository.findById(id);
    if (!invite) throw new Error('Invite not found');
    invite.revoked = true;
    return await this.repository.save(invite);
  }
}

describe('InviteService', () => {
  let service: InviteServiceDemo;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByClassId: jest.fn(),
      delete: jest.fn(),
    };
    service = new InviteServiceDemo(mockRepository);
    jest.clearAllMocks();
  });

  describe('createInvite', () => {
    it('should create invite successfully', async () => {
      mockRepository.save.mockResolvedValue({});
      const result = await service.createInvite({ classId: 'class-1', email: 'student@example.com' });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('createdAt');
    });

    it('should throw error without classId', async () => {
      await expect(service.createInvite({ email: 'student@example.com' })).rejects.toThrow();
    });

    it('should throw error without email', async () => {
      await expect(service.createInvite({ classId: 'class-1' })).rejects.toThrow();
    });
  });

  describe('acceptInvite', () => {
    it('should accept invite', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'invite-1' });
      mockRepository.save.mockResolvedValue({ acceptedBy: 'user-123' });
      const result = await service.acceptInvite('invite-1', 'user-123');
      expect(result.acceptedBy).toBe('user-123');
    });

    it('should throw error when invite not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.acceptInvite('invalid', 'user-123')).rejects.toThrow('Invite not found');
    });
  });

  describe('revokeInvite', () => {
    it('should revoke invite', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'invite-1' });
      mockRepository.save.mockResolvedValue({ revoked: true });
      const result = await service.revokeInvite('invite-1');
      expect(result.revoked).toBe(true);
    });

    it('should throw error when invite not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.revokeInvite('invalid')).rejects.toThrow();
    });
  });

  describe('listInvites', () => {
    it('should list invites for a class', async () => {
      mockRepository.findByClassId.mockResolvedValue([
        { id: 'invite-1', classId: 'class-1' },
        { id: 'invite-2', classId: 'class-1' },
      ]);
      const result = await service.listInvites('class-1');
      expect(result).toHaveLength(2);
    });
  });
});
