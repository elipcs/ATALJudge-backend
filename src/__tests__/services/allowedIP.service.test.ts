/**
 * @module __tests__/services
 * @description Allowed IP Service Unit Tests
 */

class AllowedIPServiceDemo {
  constructor(private repository: any) {}

  async createAllowedIP(data: any) {
    if (!data.ipAddress) throw new Error('IP address required');
    const created = { id: `ip-${Date.now()}`, ...data };
    await this.repository.save(created);
    return created;
  }

  async getById(id: string) {
    return await this.repository.findById(id);
  }

  async getAllowedIPs() {
    return await this.repository.findAll();
  }

  async deleteAllowedIP(id: string) {
    return await this.repository.delete(id);
  }

  async toggleStatus(id: string) {
    const ip = await this.repository.findById(id);
    if (!ip) throw new Error('Not found');
    ip.active = !ip.active;
    return await this.repository.save(ip);
  }
}

describe('AllowedIPService', () => {
  let service: AllowedIPServiceDemo;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    service = new AllowedIPServiceDemo(mockRepository);
    jest.clearAllMocks();
  });

  describe('createAllowedIP', () => {
    it('should create allowed IP successfully', async () => {
      mockRepository.save.mockResolvedValue({ id: 'ip-123', ipAddress: '192.168.1.1' });
      const result = await service.createAllowedIP({ ipAddress: '192.168.1.1' });
      expect(result).toHaveProperty('id');
      expect(result.ipAddress).toBe('192.168.1.1');
    });

    it('should throw error when IP address missing', async () => {
      await expect(service.createAllowedIP({})).rejects.toThrow('IP address required');
    });
  });

  describe('getById', () => {
    it('should get allowed IP by id', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'ip-123', ipAddress: '192.168.1.1' });
      const result = await service.getById('ip-123');
      expect(result).toHaveProperty('id');
    });

    it('should return null when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      const result = await service.getById('invalid');
      expect(result).toBeNull();
    });
  });

  describe('getAllowedIPs', () => {
    it('should get all allowed IPs', async () => {
      mockRepository.findAll.mockResolvedValue([
        { id: 'ip-1', ipAddress: '192.168.1.1' },
        { id: 'ip-2', ipAddress: '192.168.1.2' },
      ]);
      const result = await service.getAllowedIPs();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no IPs', async () => {
      mockRepository.findAll.mockResolvedValue([]);
      const result = await service.getAllowedIPs();
      expect(result).toHaveLength(0);
    });
  });

  describe('deleteAllowedIP', () => {
    it('should delete allowed IP', async () => {
      mockRepository.delete.mockResolvedValue(undefined);
      await service.deleteAllowedIP('ip-123');
      expect(mockRepository.delete).toHaveBeenCalledWith('ip-123');
    });
  });

  describe('toggleStatus', () => {
    it('should toggle IP status', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'ip-123', active: true });
      mockRepository.save.mockResolvedValue({ id: 'ip-123', active: false });
      const result = await service.toggleStatus('ip-123');
      expect(result.active).toBe(false);
    });

    it('should throw error when IP not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.toggleStatus('invalid')).rejects.toThrow('Not found');
    });
  });
});
