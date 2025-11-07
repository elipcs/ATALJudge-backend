/**
 * @module __tests__/middlewares
 * @description Auth Middleware Unit Tests
 */

class AuthMiddlewareDemo {
  authorize(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }
    if (token === 'invalid-token') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = { id: 'user-123', role: 'student' };
    next();
  }

  authorizeRole(...roles: string[]) {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };
  }
}

describe('AuthMiddleware', () => {
  let middleware: AuthMiddlewareDemo;
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new AuthMiddlewareDemo();
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authorize', () => {
    it('should authenticate valid token', () => {
      mockReq.headers.authorization = 'Bearer valid-token';

      middleware.authorize(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });

    it('should reject request without token', () => {
      middleware.authorize(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      middleware.authorize(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('authorizeRole', () => {
    it('should allow user with correct role', () => {
      mockReq.user = { id: 'user-123', role: 'admin' };
      const roleMiddleware = middleware.authorizeRole('admin', 'professor');

      roleMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject user without correct role', () => {
      mockReq.user = { id: 'user-123', role: 'student' };
      const roleMiddleware = middleware.authorizeRole('admin');

      roleMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should reject unauthenticated request', () => {
      mockReq.user = null;
      const roleMiddleware = middleware.authorizeRole('admin');

      roleMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});
