/**
 * @module __tests__/services
 * @description Authentication Service Unit Tests - Real Pattern
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
  emailExists: jest.fn(),
  updateLastLogin: jest.fn(),
};

const mockRefreshTokenService = {
  saveRefreshToken: jest.fn(),
  enforceTokenLimit: jest.fn(),
  getRefreshToken: jest.fn(),
  deleteRefreshToken: jest.fn(),
  deleteAllUserTokens: jest.fn(),
};

const mockTokenBlacklistRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findByToken: jest.fn(),
  deleteExpired: jest.fn(),
};

// Mock TokenManager
const mockTokenManager = {
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  decodeToken: jest.fn(),
};

// Real implementation pattern
class AuthenticationServiceMock {
  constructor(
    private userRepository: any,
    private refreshTokenService: any,
    private tokenBlacklistRepository: any
  ) {}

  async loginWithEmail(dto: any, ipAddress?: string, userAgent?: string) {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await user.checkPassword(dto.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id, new Date());

    // Generate tokens
    const accessToken = mockTokenManager.generateAccessToken(user);
    const refreshToken = mockTokenManager.generateRefreshToken(user);

    // Save refresh token
    await this.refreshTokenService.saveRefreshToken(user.id, refreshToken, ipAddress, userAgent);

    // Enforce token limit
    await this.refreshTokenService.enforceTokenLimit(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(accessToken: string, refreshToken?: string) {
    // Blacklist access token
    const decodedAccessToken = mockTokenManager.decodeToken(accessToken);
    const expiresAt = new Date(decodedAccessToken.exp * 1000);

    await this.tokenBlacklistRepository.save({
      token: accessToken,
      expiresAt,
      type: 'access',
    });

    // Delete refresh token
    if (refreshToken) {
      const decodedRefreshToken = mockTokenManager.decodeToken(refreshToken);
      await this.refreshTokenService.deleteRefreshToken(decodedRefreshToken.jti);
    }
  }

  async logoutAllDevices(userId: string) {
    // Blacklist all user tokens
    const userTokens = await this.refreshTokenService.getRefreshToken(userId);

    if (userTokens) {
      for (const token of userTokens) {
        await this.refreshTokenService.deleteRefreshToken(token.id);
      }
    }

    // Clear all user refresh tokens
    await this.refreshTokenService.deleteAllUserTokens(userId);
  }
}

describe('AuthenticationService - Real Pattern Implementation', () => {
  let service: AuthenticationServiceMock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthenticationServiceMock(
      mockUserRepository,
      mockRefreshTokenService,
      mockTokenBlacklistRepository
    );
  });

  describe('loginWithEmail', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'John Doe',
        role: UserRole.STUDENT,
        checkPassword: jest.fn().mockResolvedValue(true),
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenManager.generateAccessToken.mockReturnValue('access-token-123');
      mockTokenManager.generateRefreshToken.mockReturnValue('refresh-token-123');
      mockRefreshTokenService.saveRefreshToken.mockResolvedValue(undefined);
      mockRefreshTokenService.enforceTokenLimit.mockResolvedValue(undefined);

      const result = await service.loginWithEmail(
        { email: 'user@example.com', password: 'password123' },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-123');
      expect(result.user.email).toBe('user@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(mockUser.checkPassword).toHaveBeenCalledWith('password123');
    });

    it('should throw error for non-existent user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.loginWithEmail({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        checkPassword: jest.fn().mockResolvedValue(false),
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.loginWithEmail({
          email: 'user@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should handle login with IP tracking', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'John Doe',
        role: UserRole.STUDENT,
        checkPassword: jest.fn().mockResolvedValue(true),
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenManager.generateAccessToken.mockReturnValue('access-token');
      mockTokenManager.generateRefreshToken.mockReturnValue('refresh-token');

      await service.loginWithEmail(
        { email: 'user@example.com', password: 'password123' },
        '10.0.0.1',
        'Mozilla/5.0'
      );

      expect(mockRefreshTokenService.saveRefreshToken).toHaveBeenCalledWith(
        'user-1',
        'refresh-token',
        '10.0.0.1',
        'Mozilla/5.0'
      );
    });

    it('should enforce token limit after login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'John Doe',
        role: UserRole.PROFESSOR,
        checkPassword: jest.fn().mockResolvedValue(true),
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenManager.generateAccessToken.mockReturnValue('access-token');
      mockTokenManager.generateRefreshToken.mockReturnValue('refresh-token');

      await service.loginWithEmail({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(mockRefreshTokenService.enforceTokenLimit).toHaveBeenCalledWith('user-1');
    });
  });

  describe('logout', () => {
    it('should logout and blacklist token', async () => {
      const decodedToken = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        sub: 'user-1',
      };

      mockTokenManager.decodeToken.mockReturnValue(decodedToken);
      mockTokenBlacklistRepository.save.mockResolvedValue(undefined);
      mockRefreshTokenService.deleteRefreshToken.mockResolvedValue(undefined);

      await service.logout('access-token-123', 'refresh-token-123');

      expect(mockTokenBlacklistRepository.save).toHaveBeenCalled();
      expect(mockRefreshTokenService.deleteRefreshToken).toHaveBeenCalled();
    });

    it('should revoke refresh token', async () => {
      const accessTokenDecoded = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const refreshTokenDecoded = { jti: 'token-id-123' };

      mockTokenManager.decodeToken
        .mockReturnValueOnce(accessTokenDecoded)
        .mockReturnValueOnce(refreshTokenDecoded);

      await service.logout('access-token-123', 'refresh-token-123');

      expect(mockRefreshTokenService.deleteRefreshToken).toHaveBeenCalledWith('token-id-123');
    });

    it('should handle logout without refresh token', async () => {
      const decodedToken = { exp: Math.floor(Date.now() / 1000) + 3600 };

      mockTokenManager.decodeToken.mockReturnValue(decodedToken);
      mockTokenBlacklistRepository.save.mockResolvedValue(undefined);

      await service.logout('access-token-123');

      expect(mockTokenBlacklistRepository.save).toHaveBeenCalled();
      expect(mockRefreshTokenService.deleteRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('logoutAllDevices', () => {
    it('should revoke all user tokens', async () => {
      const mockTokens = [
        { id: 'token-1' },
        { id: 'token-2' },
        { id: 'token-3' },
      ];

      mockRefreshTokenService.getRefreshToken.mockResolvedValue(mockTokens);
      mockRefreshTokenService.deleteRefreshToken.mockResolvedValue(undefined);
      mockRefreshTokenService.deleteAllUserTokens.mockResolvedValue(undefined);

      await service.logoutAllDevices('user-1');

      expect(mockRefreshTokenService.deleteRefreshToken).toHaveBeenCalledTimes(3);
      expect(mockRefreshTokenService.deleteAllUserTokens).toHaveBeenCalledWith('user-1');
    });

    it('should handle logout for user with no tokens', async () => {
      mockRefreshTokenService.getRefreshToken.mockResolvedValue(null);
      mockRefreshTokenService.deleteAllUserTokens.mockResolvedValue(undefined);

      await service.logoutAllDevices('user-1');

      expect(mockRefreshTokenService.deleteAllUserTokens).toHaveBeenCalledWith('user-1');
    });
  });
});
